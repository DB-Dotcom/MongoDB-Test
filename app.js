// app.js

import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Überprüfung der MongoDB URI und DB_NAME
if (!process.env.MONGODB_URI || !process.env.DB_NAME) {
  console.error('MongoDB URI or DB_NAME is not defined. Please check your .env file or environment variables.');
  process.exit(1);
}

// Async/Await für MongoDB-Verbindungsinitialisierung
try {
  await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');
  await performAsyncOperations();
  startServer();
} catch (error) {
  console.error('Failed to connect to MongoDB:', error.message);
  process.exit(1);
}

// Schema für die Records mit Zeitstempeln
const recordSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    album: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Record = mongoose.model('Record', recordSchema);

// Funktion für asynchrone Vorbereitungen vor dem Start des Servers
async function performAsyncOperations() {
  try {
    // Füge hier deine asynchrone Logik hinzu
  } catch (error) {
    console.error('Error in performAsyncOperations:', error.message);
    // Hier kannst du weitere Fehlerbehandlungslogik hinzufügen
  }
}

function startServer() {
  const db = mongoose.connection;

  if (db.readyState !== 1) {
    console.error('Failed to connect to MongoDB. Server will not start.');
    process.exit(1);
  }

  db.once('open', () => {
    console.log('Performing async operations before starting the server');
  });

  // Middleware für das Parsen von JSON-Daten
  app.use(bodyParser.json());

  // Route zum Hinzufügen eines neuen Records
  app.post('/records', async (req, res, next) => {
    try {
      const { name, album } = req.body;
      if (!name || !album) {
        throw new Error('Name and album are required fields.');
      }
      const newRecord = new Record({ name, album });
      const savedRecord = await newRecord.save();
      res.status(201).json(savedRecord); // HTTP-Statuscode 201 für "Created"
    } catch (error) {
      next(error); // Fehler an die Fehler-Middleware weitergeben
    }
  });

  // Route zum Abrufen aller Records
app.get('/records', async (req, res, next) => {
    try {
        const records = await Record.find();
        res.json(records);
    } catch (error) {
        next(error); // Fehler an die Fehler-Middleware weitergeben
    }
});

// Fehler-Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.status || 500;
    const errorMessage = err.message || 'Something went wrong!';

    res.status(statusCode).json({ error: errorMessage });
});

// Logging-Level-Überprüfung für Winston
const logLevel = process.env.LOG_LEVEL || 'info';

if (!winston.config.levels[logLevel]) {
    console.error(`Invalid LOG_LEVEL: ${logLevel}. Valid values are ${Object.keys(winston.config.levels).join(', ')}`);
    process.exit(1);
}

  // Winston-Logger-Konfiguration
  const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
  });

  // Serverstartnachricht mit besserer Logging-Information
  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
}
