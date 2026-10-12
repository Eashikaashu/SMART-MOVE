require("dotenv").config();

const oracledb = require("oracledb");
const ORACLE_USER = process.env.ORACLE_USER;
const ORACLE_PASSWORD = process.env.ORACLE_PASSWORD;
const ORACLE_CONNECT_STRING = process.env.ORACLE_CONNECT_STRING;
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DATABASE_NAME = "SMARTMOVE";

app.use(cors());
app.use(express.json());

const client = new MongoClient(MONGO_URL);
let oraclePool;

async function connectOracle() {
    oraclePool = await oracledb.createPool({
        user: ORACLE_USER,
        password: ORACLE_PASSWORD,
        connectString: ORACLE_CONNECT_STRING
    });

    console.log("Oracle connected successfully");
}

async function startServer() {
    try {
        await client.connect();
        await connectOracle();

        const database = client.db(DATABASE_NAME);
        app.get("/api/oracle-test", async (req, res) => {
    let connection;
     
    try {
        connection = await oraclePool.getConnection();

        const result = await connection.execute(
            "SELECT USER AS CURRENT_USER FROM dual"
        );

        res.json({
            connected: true,
            user: result.rows[0][0]
        });
    } catch (error) {
        console.error("Oracle test failed:", error.message);
        res.status(500).json({
            connected: false,
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

app.get("/api/vehicles", async (req, res) => {
    let connection;

    try {
        connection = await oraclePool.getConnection();

        const result = await connection.execute(
            `SELECT VEHICLE_ID, REGISTRATION_NO, VEHICLE_TYPE, CAPACITY, STATUS
             FROM VEHICLE
             ORDER BY VEHICLE_ID`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error loading vehicles:", error.message);
        res.status(500).json({
            error: "Unable to load vehicles"
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});
app.post("/api/vehicles", async (req, res) => {
    let connection;

    try {
        const {
            registration_no,
            vehicle_type,
            capacity,
            status
        } = req.body;

        if (!registration_no || !vehicle_type || !capacity || !status) {
            return res.status(400).json({
                error: "Please provide all vehicle details"
            });
        }

        connection = await oraclePool.getConnection();

        const result = await connection.execute(
            `INSERT INTO VEHICLE
                (REGISTRATION_NO, VEHICLE_TYPE, CAPACITY, STATUS)
             VALUES
                (:registration_no, :vehicle_type, :capacity, :status)`,
            {
                registration_no,
                vehicle_type,
                capacity: Number(capacity),
                status
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Vehicle added successfully"
        });

    } catch (error) {
        console.error("Error adding vehicle:", error.message);

        res.status(500).json({
            error: "Unable to add vehicle"
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});


app.put("/api/vehicles/:id", async (req, res) => {
    let connection;

    try {
        const vehicleId = Number(req.params.id);
        const {
            registration_no,
            vehicle_type,
            capacity,
            status
        } = req.body;

        if (
            !Number.isInteger(vehicleId) ||
            vehicleId <= 0 ||
            !registration_no?.trim() ||
            !vehicle_type?.trim() ||
            !Number.isFinite(Number(capacity)) ||
            Number(capacity) <= 0 ||
            !status
        ) {
            return res.status(400).json({
                error: "Please provide valid vehicle details."
            });
        }

        connection = await oraclePool.getConnection();

        const result = await connection.execute(
            `UPDATE VEHICLE
             SET REGISTRATION_NO = :registration_no,
                 VEHICLE_TYPE = :vehicle_type,
                 CAPACITY = :capacity,
                 STATUS = :status
             WHERE VEHICLE_ID = :vehicle_id`,
            {
                registration_no: registration_no.trim(),
                vehicle_type: vehicle_type.trim(),
                capacity: Number(capacity),
                status,
                vehicle_id: vehicleId
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: "Vehicle not found."
            });
        }

        res.json({ message: "Vehicle updated successfully." });

    } catch (error) {
        console.error("Error updating vehicle:", error.message);
        res.status(500).json({
            error: "Unable to update vehicle."
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});


app.delete("/api/vehicles/:id", async (req, res) => {
    let connection;

    try {
        const vehicleId = Number(req.params.id);

        if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
            return res.status(400).json({
                error: "Invalid vehicle ID."
            });
        }

        connection = await oraclePool.getConnection();

        const result = await connection.execute(
            `DELETE FROM VEHICLE WHERE VEHICLE_ID = :vehicle_id`,
            { vehicle_id: vehicleId },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: "Vehicle not found."
            });
        }

        res.json({ message: "Vehicle deleted successfully." });

    } catch (error) {
        console.error("Error deleting vehicle:", error.message);

        res.status(500).json({
            error: "Unable to delete vehicle. It may be linked to trips or maintenance records."
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});


app.get("/api/drivers", async (req, res) => {
    let connection;

    try {
        connection = await oraclePool.getConnection();

        const result = await connection.execute(
            `SELECT DRIVER_ID, DRIVER_NAME, LICENSE_NO, PHONE, EMAIL, STATUS
             FROM DRIVER
             ORDER BY DRIVER_ID`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Error loading drivers:", error.message);

        res.status(500).json({
            error: "Unable to load drivers."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// Get all routes from Oracle
app.get("/api/routes", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT ROUTE_ID, ROUTE_NAME, START_LOCATION,
              END_LOCATION, DISTANCE_KM, ESTIMATED_DURATION
       FROM ROUTE
       ORDER BY ROUTE_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error loading routes:", error.message);
    res.status(500).json({ error: "Unable to load routes." });
  } finally {
    if (connection) await connection.close();
  }
});



app.get("/api/passengers", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT PASSENGER_ID, PASSENGER_NAME,
              NIC_PASSPORT, PHONE, EMAIL
       FROM PASSENGER
       ORDER BY PASSENGER_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error loading passengers:", error.message);

    res.status(500).json({
      error: "Unable to load passengers."
    });

  } finally {
    if (connection) await connection.close();
  }
});


app.get("/api/trips", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT TRIP_ID, ROUTE_ID, VEHICLE_ID, DRIVER_ID,
              TRIP_DATE, DEPARTURE_TIME, ARRIVAL_TIME, STATUS
       FROM TRIP
       ORDER BY TRIP_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error loading trips:", error.message);

    res.status(500).json({
      error: "Unable to load trips."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.get("/api/bookings", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT BOOKING_ID, TRIP_ID, PASSENGER_ID,
              BOOKING_DATE, SEAT_NO, FARE, STATUS
       FROM BOOKING
       ORDER BY BOOKING_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error loading bookings:", error.message);

    res.status(500).json({
      error: "Unable to load bookings."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.post("/api/bookings", async (req, res) => {
  let connection;

  try {
    const {
      booking_id,
      trip_id,
      passenger_id,
      booking_date,
      seat_no,
      fare,
      status
    } = req.body;

    if (
      !Number.isInteger(Number(booking_id)) || Number(booking_id) <= 0 ||
      !Number.isInteger(Number(trip_id)) || Number(trip_id) <= 0 ||
      !Number.isInteger(Number(passenger_id)) || Number(passenger_id) <= 0 ||
      !booking_date ||
      !Number.isInteger(Number(seat_no)) || Number(seat_no) <= 0 ||
      !Number.isFinite(Number(fare)) || Number(fare) < 0 ||
      !["Confirmed", "Pending", "Cancelled"].includes(status)
    ) {
      return res.status(400).json({
        error: "Please provide valid booking details."
      });
    }

    connection = await oraclePool.getConnection();

    await connection.execute(
      `INSERT INTO BOOKING (
        BOOKING_ID,
        TRIP_ID,
        PASSENGER_ID,
        BOOKING_DATE,
        SEAT_NO,
        FARE,
        STATUS
      ) VALUES (
        :booking_id,
        :trip_id,
        :passenger_id,
        TO_DATE(:booking_date, 'YYYY-MM-DD'),
        :seat_no,
        :fare,
        :status
      )`,
      {
        booking_id: Number(booking_id),
        trip_id: Number(trip_id),
        passenger_id: Number(passenger_id),
        booking_date,
        seat_no: Number(seat_no),
        fare: Number(fare),
        status
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Booking added successfully."
    });

  } catch (error) {
    console.error("Error adding booking:", error.message);

    if (error.errorNum === 1) {
      return res.status(409).json({
        error: "This Booking ID already exists."
      });
    }

    if ([2291, 2292].includes(error.errorNum)) {
      return res.status(409).json({
        error: "The selected Trip ID or Passenger ID is invalid, or a related record prevents this operation."
      });
    }

    res.status(500).json({
      error: "Unable to add booking. Check the booking details and database constraints."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.put("/api/bookings/:id", async (req, res) => {
  let connection;

  try {
    const bookingId = Number(req.params.id);

    const {
      trip_id,
      passenger_id,
      booking_date,
      seat_no,
      fare,
      status
    } = req.body;

    if (
      !Number.isInteger(bookingId) || bookingId <= 0 ||
      !Number.isInteger(Number(trip_id)) || Number(trip_id) <= 0 ||
      !Number.isInteger(Number(passenger_id)) || Number(passenger_id) <= 0 ||
      !booking_date ||
      !Number.isInteger(Number(seat_no)) || Number(seat_no) <= 0 ||
      !Number.isFinite(Number(fare)) || Number(fare) < 0 ||
      !["Confirmed", "Pending", "Cancelled"].includes(status)
    ) {
      return res.status(400).json({
        error: "Please provide valid booking details."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `UPDATE BOOKING
       SET TRIP_ID = :trip_id,
           PASSENGER_ID = :passenger_id,
           BOOKING_DATE = TO_DATE(:booking_date, 'YYYY-MM-DD'),
           SEAT_NO = :seat_no,
           FARE = :fare,
           STATUS = :status
       WHERE BOOKING_ID = :booking_id`,
      {
        trip_id: Number(trip_id),
        passenger_id: Number(passenger_id),
        booking_date,
        seat_no: Number(seat_no),
        fare: Number(fare),
        status,
        booking_id: bookingId
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Booking not found."
      });
    }

    res.json({
      message: "Booking updated successfully."
    });

  } catch (error) {
    console.error("Error updating booking:", error.message);

    if ([2291, 2292].includes(error.errorNum)) {
      return res.status(409).json({
        error: "The selected Trip or Passenger is invalid, or a related record prevents this update."
      });
    }

    res.status(500).json({
      error: "Unable to update booking."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.delete("/api/bookings/:id", async (req, res) => {
  let connection;

  try {
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        error: "Invalid booking ID."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `DELETE FROM BOOKING
       WHERE BOOKING_ID = :booking_id`,
      { booking_id: bookingId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Booking not found."
      });
    }

    res.json({
      message: "Booking deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting booking:", error.message);

    if (error.errorNum === 2292) {
      return res.status(409).json({
        error: "This booking is linked to payment or other records. Handle those related records before deleting this booking."
      });
    }

    res.status(500).json({
      error: "Unable to delete booking."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.post("/api/trips", async (req, res) => {
  let connection;

  try {
    const {
      trip_id,
      route_id,
      vehicle_id,
      driver_id,
      trip_date,
      departure_time,
      arrival_time,
      status
    } = req.body;

    if (
      !Number.isInteger(Number(trip_id)) || Number(trip_id) <= 0 ||
      !Number.isInteger(Number(route_id)) || Number(route_id) <= 0 ||
      !Number.isInteger(Number(vehicle_id)) || Number(vehicle_id) <= 0 ||
      !Number.isInteger(Number(driver_id)) || Number(driver_id) <= 0 ||
      !trip_date ||
      !departure_time ||
      !arrival_time ||
      !["Scheduled", "Running", "Completed", "Cancelled"].includes(status)
    ) {
      return res.status(400).json({
        error: "Please provide valid trip details."
      });
    }

    connection = await oraclePool.getConnection();

    await connection.execute(
      `INSERT INTO TRIP (
        TRIP_ID,
        ROUTE_ID,
        VEHICLE_ID,
        DRIVER_ID,
        TRIP_DATE,
        DEPARTURE_TIME,
        ARRIVAL_TIME,
        STATUS
      ) VALUES (
        :trip_id,
        :route_id,
        :vehicle_id,
        :driver_id,
        TO_DATE(:trip_date, 'YYYY-MM-DD'),
        TO_DATE(:departure_time, 'HH24:MI'),
        TO_DATE(:arrival_time, 'HH24:MI'),
        :status
      )`,
      {
        trip_id: Number(trip_id),
        route_id: Number(route_id),
        vehicle_id: Number(vehicle_id),
        driver_id: Number(driver_id),
        trip_date,
        departure_time,
        arrival_time,
        status
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Trip added successfully."
    });

  } catch (error) {
    console.error("Error adding trip:", error.message);

    if (error.errorNum === 1) {
      return res.status(409).json({
        error: "This Trip ID already exists."
      });
    }

    if ([2291, 2292].includes(error.errorNum)) {
      return res.status(409).json({
        error: "The selected Route, Vehicle, or Driver does not exist or is linked to another record."
      });
    }

    res.status(500).json({
      error: "Unable to add trip. Check the trip details and database constraints."
    });

  } finally {
    if (connection) await connection.close();
  }
});


app.put("/api/trips/:id", async (req, res) => {
  let connection;

  try {
    const tripId = Number(req.params.id);

    const {
      route_id,
      vehicle_id,
      driver_id,
      trip_date,
      departure_time,
      arrival_time,
      status
    } = req.body;

    if (
      !Number.isInteger(tripId) || tripId <= 0 ||
      !Number.isInteger(Number(route_id)) || Number(route_id) <= 0 ||
      !Number.isInteger(Number(vehicle_id)) || Number(vehicle_id) <= 0 ||
      !Number.isInteger(Number(driver_id)) || Number(driver_id) <= 0 ||
      !trip_date ||
      !departure_time ||
      !arrival_time ||
      !["Scheduled", "Running", "Completed", "Cancelled"].includes(status)
    ) {
      return res.status(400).json({
        error: "Please provide valid trip details."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `UPDATE TRIP
       SET ROUTE_ID = :route_id,
           VEHICLE_ID = :vehicle_id,
           DRIVER_ID = :driver_id,
           TRIP_DATE = TO_DATE(:trip_date, 'YYYY-MM-DD'),
           DEPARTURE_TIME = TO_DATE(:departure_time, 'HH24:MI'),
           ARRIVAL_TIME = TO_DATE(:arrival_time, 'HH24:MI'),
           STATUS = :status
       WHERE TRIP_ID = :trip_id`,
      {
        route_id: Number(route_id),
        vehicle_id: Number(vehicle_id),
        driver_id: Number(driver_id),
        trip_date,
        departure_time,
        arrival_time,
        status,
        trip_id: tripId
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Trip not found."
      });
    }

    res.json({
      message: "Trip updated successfully."
    });

  } catch (error) {
    console.error("Error updating trip:", error.message);

    if ([2291, 2292].includes(error.errorNum)) {
      return res.status(409).json({
        error: "The selected Route, Vehicle, or Driver is invalid."
      });
    }

    res.status(500).json({
      error: "Unable to update trip."
    });

  } finally {
    if (connection) await connection.close();
  }
});


app.delete("/api/trips/:id", async (req, res) => {
  let connection;

  try {
    const tripId = Number(req.params.id);

    if (!Number.isInteger(tripId) || tripId <= 0) {
      return res.status(400).json({
        error: "Invalid trip ID."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `DELETE FROM TRIP WHERE TRIP_ID = :trip_id`,
      { trip_id: tripId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Trip not found."
      });
    }

    res.json({
      message: "Trip deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting trip:", error.message);

    if (error.errorNum === 2292) {
      return res.status(409).json({
        error: "This trip is linked to bookings or other records. Handle those related records before deleting this trip."
      });
    }

    res.status(500).json({
      error: "Unable to delete trip."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.post("/api/passengers", async (req, res) => {
  let connection;

  try {
    const {
      passenger_id,
      passenger_name,
      nic_passport,
      phone,
      email
    } = req.body;

    if (
      !Number.isInteger(Number(passenger_id)) ||
      Number(passenger_id) <= 0 ||
      !passenger_name?.trim() ||
      !nic_passport?.trim() ||
      !phone?.trim() ||
      !email?.trim()
    ) {
      return res.status(400).json({
        error: "Please fill in all passenger fields correctly."
      });
    }

    connection = await oraclePool.getConnection();

    await connection.execute(
      `INSERT INTO PASSENGER (
        PASSENGER_ID,
        PASSENGER_NAME,
        NIC_PASSPORT,
        PHONE,
        EMAIL
      ) VALUES (
        :passenger_id,
        :passenger_name,
        :nic_passport,
        :phone,
        :email
      )`,
      {
        passenger_id: Number(passenger_id),
        passenger_name: passenger_name.trim(),
        nic_passport: nic_passport.trim(),
        phone: phone.trim(),
        email: email.trim()
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Passenger added successfully."
    });

  } catch (error) {
    console.error("Error adding passenger:", error.message);

    if (error.errorNum === 1) {
      return res.status(409).json({
        error: "This Passenger ID or NIC/Passport already exists. Please check the details."
      });
    }

    res.status(500).json({
      error: "Unable to add passenger. Check the passenger details and database constraints."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.put("/api/passengers/:id", async (req, res) => {
  let connection;

  try {
    const passengerId = Number(req.params.id);

    const {
      passenger_name,
      nic_passport,
      phone,
      email
    } = req.body;

    if (
      !Number.isInteger(passengerId) ||
      passengerId <= 0 ||
      !passenger_name?.trim() ||
      !nic_passport?.trim() ||
      !phone?.trim() ||
      !email?.trim()
    ) {
      return res.status(400).json({
        error: "Please provide valid passenger details."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `UPDATE PASSENGER
       SET PASSENGER_NAME = :passenger_name,
           NIC_PASSPORT = :nic_passport,
           PHONE = :phone,
           EMAIL = :email
       WHERE PASSENGER_ID = :passenger_id`,
      {
        passenger_name: passenger_name.trim(),
        nic_passport: nic_passport.trim(),
        phone: phone.trim(),
        email: email.trim(),
        passenger_id: passengerId
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Passenger not found."
      });
    }

    res.json({
      message: "Passenger updated successfully."
    });

  } catch (error) {
    console.error("Error updating passenger:", error.message);

    if (error.errorNum === 1) {
      return res.status(409).json({
        error: "This NIC/Passport or another unique value already exists."
      });
    }

    res.status(500).json({
      error: "Unable to update passenger."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.delete("/api/passengers/:id", async (req, res) => {
  let connection;

  try {
    const passengerId = Number(req.params.id);

    if (!Number.isInteger(passengerId) || passengerId <= 0) {
      return res.status(400).json({
        error: "Invalid passenger ID."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `DELETE FROM PASSENGER
       WHERE PASSENGER_ID = :passenger_id`,
      { passenger_id: passengerId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Passenger not found."
      });
    }

    res.json({
      message: "Passenger deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting passenger:", error.message);

    if (error.errorNum === 2292) {
      return res.status(409).json({
        error: "This passenger is linked to existing bookings or other records. You cannot delete this passenger until the related records are handled."
      });
    }

    res.status(500).json({
      error: "Unable to delete passenger."
    });

  } finally {
    if (connection) await connection.close();
  }
});


app.post("/api/routes", async (req, res) => {
  let connection;

  try {
    const {
      route_id,
      route_name,
      start_location,
      end_location,
      distance_km,
      estimated_duration
    } = req.body;

    if (
      !Number.isInteger(Number(route_id)) ||
      Number(route_id) <= 0 ||
      !route_name?.trim() ||
      !start_location?.trim() ||
      !end_location?.trim() ||
      distance_km === "" ||
      distance_km === null ||
      distance_km === undefined ||
      !Number.isFinite(Number(distance_km)) ||
      Number(distance_km) < 0 ||
      !Number.isInteger(Number(estimated_duration)) ||
      Number(estimated_duration) <= 0
    ) {
      return res.status(400).json({
        error: "Please provide valid route details."
      });
    }

    connection = await oraclePool.getConnection();

    await connection.execute(
      `INSERT INTO ROUTE (
        ROUTE_ID,
        ROUTE_NAME,
        START_LOCATION,
        END_LOCATION,
        DISTANCE_KM,
        ESTIMATED_DURATION
      ) VALUES (
        :route_id,
        :route_name,
        :start_location,
        :end_location,
        :distance_km,
        :estimated_duration
      )`,
      {
        route_id: Number(route_id),
        route_name: route_name.trim(),
        start_location: start_location.trim(),
        end_location: end_location.trim(),
        distance_km: Number(distance_km),
        estimated_duration: Number(estimated_duration)
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Route added successfully."
    });

  } catch (error) {
    console.error("Error adding route:", error.message);

    if (error.errorNum === 1) {
      return res.status(409).json({
        error: "This Route ID already exists. Please use a different ID."
      });
    }

    res.status(500).json({
      error: "Unable to add route. Check the route details and database constraints."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.put("/api/routes/:id", async (req, res) => {
  let connection;

  try {
    const routeId = Number(req.params.id);

    const {
      route_name,
      start_location,
      end_location,
      distance_km,
      estimated_duration
    } = req.body;

    if (
      !Number.isInteger(routeId) ||
      routeId <= 0 ||
      !route_name?.trim() ||
      !start_location?.trim() ||
      !end_location?.trim() ||
      distance_km === "" ||
      distance_km === null ||
      distance_km === undefined ||
      !Number.isFinite(Number(distance_km)) ||
      Number(distance_km) < 0 ||
      !Number.isInteger(Number(estimated_duration)) ||
      Number(estimated_duration) <= 0
    ) {
      return res.status(400).json({
        error: "Please provide valid route details."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `UPDATE ROUTE
       SET ROUTE_NAME = :route_name,
           START_LOCATION = :start_location,
           END_LOCATION = :end_location,
           DISTANCE_KM = :distance_km,
           ESTIMATED_DURATION = :estimated_duration
       WHERE ROUTE_ID = :route_id`,
      {
        route_name: route_name.trim(),
        start_location: start_location.trim(),
        end_location: end_location.trim(),
        distance_km: Number(distance_km),
        estimated_duration: Number(estimated_duration),
        route_id: routeId
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Route not found."
      });
    }

    res.json({ message: "Route updated successfully." });

  } catch (error) {
    console.error("Error updating route:", error.message);

    res.status(500).json({
      error: "Unable to update route."
    });

  } finally {
    if (connection) await connection.close();
  }
});


app.delete("/api/routes/:id", async (req, res) => {
  let connection;

  try {
    const routeId = Number(req.params.id);

    if (!Number.isInteger(routeId) || routeId <= 0) {
      return res.status(400).json({
        error: "Invalid route ID."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `DELETE FROM ROUTE WHERE ROUTE_ID = :route_id`,
      { route_id: routeId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Route not found."
      });
    }

    res.json({
      message: "Route deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting route:", error.message);

    if (error.errorNum === 2292) {
      return res.status(409).json({
        error: "This route is linked to existing trips. You cannot delete it until those related records are handled."
      });
    }

    res.status(500).json({
      error: "Unable to delete route."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.post("/api/drivers", async (req, res) => {
    let connection;

    try {
        const {
            driver_id,
            driver_name,
            license_no,
            phone,
            email,
            status
        } = req.body;

        if (
            !driver_id ||
            !driver_name?.trim() ||
            !license_no?.trim() ||
            !phone?.trim() ||
            !email?.trim() ||
            !status?.trim()
        ) {
            return res.status(400).json({
                error: "Please fill in all driver fields."
            });
        }

        connection = await oraclePool.getConnection();

        await connection.execute(
            `INSERT INTO DRIVER
                (DRIVER_ID, DRIVER_NAME, LICENSE_NO, PHONE, EMAIL, STATUS)
             VALUES
                (:driver_id, :driver_name, :license_no, :phone, :email, :status)`,
            {
                driver_id: Number(driver_id),
                driver_name: driver_name.trim(),
                license_no: license_no.trim(),
                phone: phone.trim(),
                email: email.trim(),
                status: status.trim()
            },
            { autoCommit: true }
        );

        res.status(201).json({
            message: "Driver added successfully."
        });

    } catch (error) {
        console.error("Error adding driver:", error.message);

        res.status(500).json({
            error: "Unable to add driver. Check the driver ID and database constraints."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});



app.put("/api/drivers/:id", async (req, res) => {
    let connection;

    try {
        const driverId = Number(req.params.id);
        const {
            driver_name,
            license_no,
            phone,
            email,
            status
        } = req.body;

        if (
            !Number.isInteger(driverId) ||
            driverId <= 0 ||
            !driver_name?.trim() ||
            !license_no?.trim() ||
            !phone?.trim() ||
            !email?.trim() ||
            !status?.trim()
        ) {
            return res.status(400).json({
                error: "Please provide valid driver details."
            });
        }

        connection = await oraclePool.getConnection();

        const result = await connection.execute(
            `UPDATE DRIVER
             SET DRIVER_NAME = :driver_name,
                 LICENSE_NO = :license_no,
                 PHONE = :phone,
                 EMAIL = :email,
                 STATUS = :status
             WHERE DRIVER_ID = :driver_id`,
            {
                driver_name: driver_name.trim(),
                license_no: license_no.trim(),
                phone: phone.trim(),
                email: email.trim(),
                status: status.trim(),
                driver_id: driverId
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: "Driver not found."
            });
        }

        res.json({ message: "Driver updated successfully." });

    } catch (error) {
        console.error("Error updating driver:", error.message);
        res.status(500).json({
            error: "Unable to update driver."
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});



app.delete("/api/drivers/:id", async (req, res) => {
    let connection;

    try {
        const driverId = Number(req.params.id);

        if (!Number.isInteger(driverId) || driverId <= 0) {
            return res.status(400).json({
                error: "Invalid driver ID."
            });
        }

        connection = await oraclePool.getConnection();

        const result = await connection.execute(
            `DELETE FROM DRIVER WHERE DRIVER_ID = :driver_id`,
            { driver_id: driverId },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: "Driver not found."
            });
        }

        res.json({
            message: "Driver deleted successfully."
        });

    } catch (error) {
        console.error("Error deleting driver:", error.message);

        if (error.errorNum === 2292) {
            return res.status(409).json({
                error: "This driver is linked to other records. Remove or reassign those related records before deleting this driver."
            });
        }

        res.status(500).json({
            error: "Unable to delete driver."
        });

    } finally {
        if (connection) {
            await connection.close();
        }
    }
});



app.get("/api/payments", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT PAYMENT_ID, BOOKING_ID, PAYMENT_DATE,
              AMOUNT, PAYMENT_METHOD, TRANSACTION_REF, STATUS
       FROM PAYMENT
       ORDER BY PAYMENT_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching payments:", error.message);
    res.status(500).json({ error: "Unable to fetch payments." });
  } finally {
    if (connection) await connection.close();
  }
});



app.post("/api/payments", async (req, res) => {
  let connection;

  try {
    const {
      payment_id,
      booking_id,
      payment_date,
      amount,
      payment_method,
      transaction_ref,
      status
    } = req.body;

    if (
      !Number.isInteger(Number(payment_id)) ||
      Number(payment_id) <= 0 ||
      !Number.isInteger(Number(booking_id)) ||
      Number(booking_id) <= 0 ||
      !payment_date ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !payment_method ||
      !status
    ) {
      return res.status(400).json({
        error: "Please provide valid payment details."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `INSERT INTO PAYMENT
       (PAYMENT_ID, BOOKING_ID, PAYMENT_DATE, AMOUNT,
        PAYMENT_METHOD, TRANSACTION_REF, STATUS)
       VALUES
       (:payment_id, :booking_id,
        TO_DATE(:payment_date, 'YYYY-MM-DD'), :amount,
        :payment_method, :transaction_ref, :status)`,
      {
        payment_id: Number(payment_id),
        booking_id: Number(booking_id),
        payment_date,
        amount: Number(amount),
        payment_method,
        transaction_ref: transaction_ref || null,
        status
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Payment added successfully."
    });
  } catch (error) {
    console.error("Error adding payment:", error.message);

    if (error.errorNum === 1) {
      return res.status(409).json({
        error: "This Payment ID already exists."
      });
    }

    if (error.errorNum === 2291) {
      return res.status(400).json({
        error: "The selected Booking ID does not exist."
      });
    }

    res.status(500).json({
      error: "Unable to add payment."
    });
  } finally {
    if (connection) await connection.close();
  }
});



app.put("/api/payments/:id", async (req, res) => {
  let connection;

  try {
    const paymentId = Number(req.params.id);
    const {
      booking_id,
      payment_date,
      amount,
      payment_method,
      transaction_ref,
      status
    } = req.body;

    if (
      !Number.isInteger(paymentId) ||
      paymentId <= 0 ||
      !Number.isInteger(Number(booking_id)) ||
      Number(booking_id) <= 0 ||
      !payment_date ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !payment_method ||
      !status
    ) {
      return res.status(400).json({
        error: "Please provide valid payment details."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `UPDATE PAYMENT
       SET BOOKING_ID = :booking_id,
           PAYMENT_DATE = TO_DATE(:payment_date, 'YYYY-MM-DD'),
           AMOUNT = :amount,
           PAYMENT_METHOD = :payment_method,
           TRANSACTION_REF = :transaction_ref,
           STATUS = :status
       WHERE PAYMENT_ID = :payment_id`,
      {
        payment_id: paymentId,
        booking_id: Number(booking_id),
        payment_date,
        amount: Number(amount),
        payment_method,
        transaction_ref: transaction_ref || null,
        status
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Payment not found."
      });
    }

    res.json({ message: "Payment updated successfully." });
  } catch (error) {
    console.error("Error updating payment:", error.message);

    if (error.errorNum === 2291) {
      return res.status(400).json({
        error: "The selected Booking ID does not exist."
      });
    }

    res.status(500).json({
      error: "Unable to update payment."
    });
  } finally {
    if (connection) await connection.close();
  }
});



app.delete("/api/payments/:id", async (req, res) => {
  let connection;

  try {
    const paymentId = Number(req.params.id);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({
        error: "Invalid Payment ID."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `DELETE FROM PAYMENT WHERE PAYMENT_ID = :payment_id`,
      { payment_id: paymentId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Payment not found."
      });
    }

    res.json({
      message: "Payment deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting payment:", error.message);

    if (error.errorNum === 2292) {
      return res.status(409).json({
        error: "This payment is linked to other records and cannot be deleted."
      });
    }

    res.status(500).json({
      error: "Unable to delete payment."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.get("/api/maintenance", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT MAINTENANCE_ID, VEHICLE_ID, MAINTENANCE_TYPE,
              DESCRIPTION, COST, NEXT_DUE_DATE, STATUS
       FROM MAINTENANCE
       ORDER BY MAINTENANCE_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching maintenance:", error.message);
    res.status(500).json({
      error: "Unable to fetch maintenance records."
    });
  } finally {
    if (connection) await connection.close();
  }
});




app.post("/api/maintenance", async (req, res) => {
  let connection;

  try {
    const {
      maintenance_id,
      vehicle_id,
      maintenance_type,
      description,
      maintenance_date,
      cost,
      next_due_date,
      status
    } = req.body;

    if (
      !Number.isInteger(Number(maintenance_id)) ||
      Number(maintenance_id) <= 0 ||
      !Number.isInteger(Number(vehicle_id)) ||
      Number(vehicle_id) <= 0 ||
      !maintenance_type ||
      !maintenance_date ||
      !next_due_date ||
      !Number.isFinite(Number(cost)) ||
      Number(cost) < 0 ||
      !status
    ) {
      return res.status(400).json({
        error: "Please provide valid maintenance details."
      });
    }

    connection = await oraclePool.getConnection();

    await connection.execute(
      `INSERT INTO MAINTENANCE
       (
         MAINTENANCE_ID,
         VEHICLE_ID,
         MAINTENANCE_TYPE,
         DESCRIPTION,
         MAINTENANCE_DATE,
         COST,
         NEXT_DUE_DATE,
         STATUS
       )
       VALUES
       (
         :maintenance_id,
         :vehicle_id,
         :maintenance_type,
         :description,
         TO_DATE(:maintenance_date, 'YYYY-MM-DD'),
         :cost,
         TO_DATE(:next_due_date, 'YYYY-MM-DD'),
         :status
       )`,
      {
        maintenance_id: Number(maintenance_id),
        vehicle_id: Number(vehicle_id),
        maintenance_type: maintenance_type.trim(),
        description: description || null,
        maintenance_date,
        cost: Number(cost),
        next_due_date,
        status
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Maintenance record added successfully."
    });

  } catch (error) {
    console.error("Error adding maintenance:", error.message);

    if (error.errorNum === 1) {
      return res.status(409).json({
        error: "This Maintenance ID already exists."
      });
    }

    if (error.errorNum === 2291) {
      return res.status(400).json({
        error: "The selected Vehicle ID does not exist."
      });
    }

    if (error.errorNum === 1400) {
      return res.status(400).json({
        error: "A required field is missing."
      });
    }

    res.status(500).json({
      error: "Unable to add maintenance record."
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});


app.put("/api/maintenance/:id", async (req, res) => {
  let connection;

  try {
    const maintenanceId = Number(req.params.id);

    const {
      vehicle_id,
      maintenance_type,
      description,
      maintenance_date,
      cost,
      next_due_date,
      status
    } = req.body;

    if (
      !Number.isInteger(maintenanceId) ||
      maintenanceId <= 0 ||
      !Number.isInteger(Number(vehicle_id)) ||
      Number(vehicle_id) <= 0 ||
      !maintenance_type ||
      !maintenance_date ||
      !next_due_date ||
      !Number.isFinite(Number(cost)) ||
      Number(cost) < 0 ||
      !status
    ) {
      return res.status(400).json({
        error: "Please provide valid maintenance details."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `UPDATE MAINTENANCE
       SET VEHICLE_ID = :vehicle_id,
           MAINTENANCE_TYPE = :maintenance_type,
           DESCRIPTION = :description,
           MAINTENANCE_DATE =
             TO_DATE(:maintenance_date, 'YYYY-MM-DD'),
           COST = :cost,
           NEXT_DUE_DATE =
             TO_DATE(:next_due_date, 'YYYY-MM-DD'),
           STATUS = :status
       WHERE MAINTENANCE_ID = :maintenance_id`,
      {
        maintenance_id: maintenanceId,
        vehicle_id: Number(vehicle_id),
        maintenance_type: maintenance_type.trim(),
        description: description || null,
        maintenance_date,
        cost: Number(cost),
        next_due_date,
        status
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Maintenance record not found."
      });
    }

    res.json({
      message: "Maintenance record updated successfully."
    });

  } catch (error) {
    console.error("Error updating maintenance:", error.message);

    if (error.errorNum === 2291) {
      return res.status(400).json({
        error: "The selected Vehicle ID does not exist."
      });
    }

    res.status(500).json({
      error: "Unable to update maintenance record."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.delete("/api/maintenance/:id", async (req, res) => {
  let connection;

  try {
    const maintenanceId = Number(req.params.id);

    if (!Number.isInteger(maintenanceId) || maintenanceId <= 0) {
      return res.status(400).json({
        error: "Invalid Maintenance ID."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `DELETE FROM MAINTENANCE
       WHERE MAINTENANCE_ID = :maintenance_id`,
      { maintenance_id: maintenanceId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Maintenance record not found."
      });
    }

    res.json({
      message: "Maintenance record deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting maintenance:", error.message);

    if (error.errorNum === 2292) {
      return res.status(409).json({
        error: "This maintenance record is linked to other records and cannot be deleted."
      });
    }

    res.status(500).json({
      error: "Unable to delete maintenance record."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.get("/api/feedback", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT FEEDBACK_ID, PASSENGER_ID, TRIP_ID, RATING, COMMENTS
       FROM FEEDBACK
       ORDER BY FEEDBACK_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching feedback:", error.message);

    res.status(500).json({
      error: "Unable to fetch feedback records."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.post("/api/feedback", async (req, res) => {
  let connection;

  try {
    const {
      feedback_id,
      passenger_id,
      trip_id,
      rating,
      comments
    } = req.body;

    if (
      !Number.isInteger(Number(feedback_id)) ||
      Number(feedback_id) <= 0 ||
      !Number.isInteger(Number(passenger_id)) ||
      Number(passenger_id) <= 0 ||
      !Number.isInteger(Number(trip_id)) ||
      Number(trip_id) <= 0 ||
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5 ||
      !comments ||
      !comments.trim()
    ) {
      return res.status(400).json({
        error: "Please provide valid feedback details. Rating must be 1–5."
      });
    }

    connection = await oraclePool.getConnection();

    await connection.execute(
      `INSERT INTO FEEDBACK
       (FEEDBACK_ID, PASSENGER_ID, TRIP_ID, RATING, COMMENTS)
       VALUES
       (:feedback_id, :passenger_id, :trip_id, :rating, :comments)`,
      {
        feedback_id: Number(feedback_id),
        passenger_id: Number(passenger_id),
        trip_id: Number(trip_id),
        rating: Number(rating),
        comments: comments.trim()
      },
      { autoCommit: true }
    );

    res.status(201).json({
      message: "Feedback added successfully."
    });

  } catch (error) {
    console.error("Error adding feedback:", error.message);

    if (error.errorNum === 1) {
      return res.status(409).json({
        error: "This Feedback ID already exists."
      });
    }

    if (error.errorNum === 2291) {
      return res.status(400).json({
        error: "The selected Passenger ID or Trip ID does not exist."
      });
    }

    res.status(500).json({
      error: "Unable to add feedback."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.put("/api/feedback/:id", async (req, res) => {
  let connection;

  try {
    const feedbackId = Number(req.params.id);

    const {
      passenger_id,
      trip_id,
      rating,
      comments
    } = req.body;

    if (
      !Number.isInteger(feedbackId) ||
      feedbackId <= 0 ||
      !Number.isInteger(Number(passenger_id)) ||
      Number(passenger_id) <= 0 ||
      !Number.isInteger(Number(trip_id)) ||
      Number(trip_id) <= 0 ||
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5 ||
      !comments ||
      !comments.trim()
    ) {
      return res.status(400).json({
        error: "Please provide valid feedback details. Rating must be 1–5."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `UPDATE FEEDBACK
       SET PASSENGER_ID = :passenger_id,
           TRIP_ID = :trip_id,
           RATING = :rating,
           COMMENTS = :comments
       WHERE FEEDBACK_ID = :feedback_id`,
      {
        feedback_id: feedbackId,
        passenger_id: Number(passenger_id),
        trip_id: Number(trip_id),
        rating: Number(rating),
        comments: comments.trim()
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Feedback record not found."
      });
    }

    res.json({
      message: "Feedback updated successfully."
    });

  } catch (error) {
    console.error("Error updating feedback:", error.message);

    if (error.errorNum === 2291) {
      return res.status(400).json({
        error: "The selected Passenger ID or Trip ID does not exist."
      });
    }

    res.status(500).json({
      error: "Unable to update feedback."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.delete("/api/feedback/:id", async (req, res) => {
  let connection;

  try {
    const feedbackId = Number(req.params.id);

    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      return res.status(400).json({
        error: "Invalid Feedback ID."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `DELETE FROM FEEDBACK
       WHERE FEEDBACK_ID = :feedback_id`,
      { feedback_id: feedbackId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: "Feedback record not found."
      });
    }

    res.json({
      message: "Feedback deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting feedback:", error.message);

    if (error.errorNum === 2292) {
      return res.status(409).json({
        error: "This feedback record is linked to other records and cannot be deleted."
      });
    }

    res.status(500).json({
      error: "Unable to delete feedback."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.get("/api/reports/summary", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT
        (SELECT COUNT(*) FROM DRIVER) AS TOTAL_DRIVERS,
        (SELECT COUNT(*) FROM VEHICLE) AS TOTAL_VEHICLES,
        (SELECT COUNT(*) FROM ROUTE) AS TOTAL_ROUTES,
        (SELECT COUNT(*) FROM PASSENGER) AS TOTAL_PASSENGERS,
        (SELECT COUNT(*) FROM TRIP) AS TOTAL_TRIPS,
        (SELECT COUNT(*) FROM BOOKING) AS TOTAL_BOOKINGS,
        (SELECT COUNT(*) FROM PAYMENT) AS TOTAL_PAYMENTS,
        (SELECT COUNT(*) FROM MAINTENANCE) AS TOTAL_MAINTENANCE,
        (SELECT COUNT(*) FROM FEEDBACK) AS TOTAL_FEEDBACK
       FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error fetching report summary:", error.message);

    res.status(500).json({
      error: "Unable to fetch report summary."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.get("/api/reports/route-usage", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT
         r.ROUTE_ID,
         r.ROUTE_NAME,
         r.START_LOCATION,
         r.END_LOCATION,
         COUNT(b.BOOKING_ID) AS TOTAL_BOOKINGS
       FROM ROUTE r
       LEFT JOIN TRIP t ON r.ROUTE_ID = t.ROUTE_ID
       LEFT JOIN BOOKING b ON t.TRIP_ID = b.TRIP_ID
       GROUP BY
         r.ROUTE_ID,
         r.ROUTE_NAME,
         r.START_LOCATION,
         r.END_LOCATION
       ORDER BY TOTAL_BOOKINGS DESC, r.ROUTE_ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching route usage:", error.message);
    res.status(500).json({
      error: "Unable to fetch route usage report."
    });
  } finally {
    if (connection) await connection.close();
  }
});



app.get("/api/reports/revenue", async (req, res) => {
  let connection;

  try {
    const { start_date, end_date } = req.query;

    if (
      !start_date ||
      !end_date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(start_date) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(end_date) ||
      start_date > end_date
    ) {
      return res.status(400).json({
        error: "Please provide valid start_date and end_date."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT
         COUNT(*) AS TOTAL_PAYMENTS,
         NVL(SUM(AMOUNT), 0) AS TOTAL_REVENUE
       FROM PAYMENT
       WHERE STATUS = 'Paid'
         AND PAYMENT_DATE >= TO_DATE(:start_date, 'YYYY-MM-DD')
         AND PAYMENT_DATE < TO_DATE(:end_date, 'YYYY-MM-DD') + 1`,
      { start_date, end_date },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Revenue report error:", error.message);
    res.status(500).json({
      error: "Unable to load revenue report."
    });
  } finally {
    if (connection) await connection.close();
  }
});



app.get("/api/reports/passenger-history", async (req, res) => {
  let connection;

  try {
    const passengerId = Number(req.query.passenger_id);

    if (!Number.isInteger(passengerId) || passengerId <= 0) {
      return res.status(400).json({
        error: "Please provide a valid passenger_id."
      });
    }

    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT
         P.PASSENGER_ID,
         P.PASSENGER_NAME,
         B.BOOKING_ID,
         B.BOOKING_DATE,
         B.SEAT_NO,
         B.STATUS AS BOOKING_STATUS,
         T.TRIP_ID,
         T.TRIP_DATE,
         R.ROUTE_NAME,
         R.START_LOCATION,
         R.END_LOCATION
       FROM PASSENGER P
       JOIN BOOKING B ON P.PASSENGER_ID = B.PASSENGER_ID
       JOIN TRIP T ON B.TRIP_ID = T.TRIP_ID
       JOIN ROUTE R ON T.ROUTE_ID = R.ROUTE_ID
       WHERE P.PASSENGER_ID = :passenger_id
       ORDER BY B.BOOKING_DATE DESC`,
      { passenger_id: passengerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Passenger history report error:", error.message);
    res.status(500).json({
      error: "Unable to load passenger travel history."
    });
  } finally {
    if (connection) await connection.close();
  }
});


        console.log("MongoDB connected successfully");

        app.get("/api/reviews", async (req, res) => {
            try {
                const reviews = await database
                    .collection("reviews")
                    .find({})
                    .toArray();

                res.json(reviews);
            } catch (error) {
                console.error("Error loading reviews:", error);
                res.status(500).json({
                    error: "Unable to load reviews"
                });
            }
        });

        app.get("/api/announcements", async (req, res) => {
            try {
                const announcements = await database
                    .collection("announcements")
                    .find({})
                    .toArray();

                res.json(announcements);
            } catch (error) {
                console.error("Error loading announcements:", error);
                res.status(500).json({
                    error: "Unable to load announcements"
                });
            }
        });

        app.get("/api/vehicle-media", async (req, res) => {
            try {
                const media = await database
                    .collection("vehicle_media")
                    .find({})
                    .toArray();

                res.json(media);
            } catch (error) {
                console.error("Error loading vehicle media:", error);
                res.status(500).json({
                    error: "Unable to load vehicle media"
                });
            }
        });

        app.get("/api/trip-media", async (req, res) => {
            try {
                const media = await database
                    .collection("trip_media")
                    .find({})
                    .toArray();

                res.json(media);
            } catch (error) {
                console.error("Error loading trip media:", error);
                res.status(500).json({
                    error: "Unable to load trip media"
                });
            }
        });
        

        app.get("/", (req, res) => {
            res.json({
                message: "SmartMove API is running"
            });
        });
        

app.get("/api/reports/maintenance", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT
         M.MAINTENANCE_ID,
         M.VEHICLE_ID,
         V.REGISTRATION_NO,
         M.MAINTENANCE_DATE,
         M.MAINTENANCE_TYPE,
         M.DESCRIPTION,
         M.COST,
         M.NEXT_DUE_DATE,
         M.STATUS
       FROM MAINTENANCE M
       JOIN VEHICLE V
         ON M.VEHICLE_ID = V.VEHICLE_ID
       ORDER BY M.NEXT_DUE_DATE`,
      [],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      }
    );

    res.json(result.rows);

  } catch (error) {
    console.error(
      "Maintenance report error:",
      error.message
    );

    res.status(500).json({
      error: "Unable to load maintenance report."
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});



app.get("/api/reports/payments", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT
         STATUS,
         COUNT(*) AS TOTAL_PAYMENTS,
         SUM(AMOUNT) AS TOTAL_AMOUNT
       FROM PAYMENT
       GROUP BY STATUS
       ORDER BY STATUS`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Payment report error:", error.message);

    res.status(500).json({
      error: "Unable to load payment collection report."
    });
  } finally {
    if (connection) await connection.close();
  }
});



app.get("/api/dashboard/summary", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT
         (SELECT COUNT(*) FROM VEHICLE) AS TOTAL_VEHICLES,
         (SELECT COUNT(*) FROM DRIVER) AS TOTAL_DRIVERS,
         (SELECT COUNT(*) FROM PASSENGER) AS TOTAL_PASSENGERS,
         (SELECT COUNT(*) FROM TRIP) AS TOTAL_TRIPS,
         (SELECT COUNT(*) FROM BOOKING) AS TOTAL_BOOKINGS,
         (SELECT COUNT(*) FROM PAYMENT) AS TOTAL_PAYMENTS,
         (SELECT NVL(SUM(AMOUNT), 0)
          FROM PAYMENT
          WHERE STATUS = 'Paid'
            AND PAYMENT_DATE >= TRUNC(SYSDATE)
            AND PAYMENT_DATE < TRUNC(SYSDATE) + 1) AS TODAY_REVENUE
       FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Dashboard summary error:", error.message);

    res.status(500).json({
      error: "Unable to load dashboard summary."
    });

  } finally {
    if (connection) await connection.close();
  }
});



app.get("/api/dashboard/recent-trips", async (req, res) => {
  let connection;

  try {
    connection = await oraclePool.getConnection();

    const result = await connection.execute(
      `SELECT
         T.TRIP_ID,
         R.ROUTE_NAME,
         V.REGISTRATION_NO,
         T.DEPARTURE_TIME,
         T.STATUS
       FROM TRIP T
       JOIN ROUTE R ON T.ROUTE_ID = R.ROUTE_ID
       JOIN VEHICLE V ON T.VEHICLE_ID = V.VEHICLE_ID
       ORDER BY T.TRIP_ID DESC
       FETCH FIRST 4 ROWS ONLY`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Recent trips error:", error.message);
    res.status(500).json({
      error: "Unable to load recent trips."
    });
  } finally {
    if (connection) await connection.close();
  }
});


        app.listen(PORT, () => {
            console.log(`SmartMove backend running on port ${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

startServer();