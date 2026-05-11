const mongoose = require("mongoose");

const alergiaSchema = new mongoose.Schema(
  {
    sustancia: {
      type: String,
      required: true,
      trim: true,
    },
    severidad: {
      type: String,
      enum: ["leve", "moderada", "severa"],
      required: true,
    },
    notas: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: true,
      trim: true,
    },
    correo: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    /** Fecha usada como “cumpleaños” del paciente (año recomendado para edad/expediente). */
    fechaCumpleanos: {
      type: Date,
      required: true,
    },
    /** Identificador de expediente clínico, único en el sistema (ej. EXP-00123). */
    numeroExpediente: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    alergias: {
      type: [alergiaSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Patient ||
  mongoose.model("Patient", patientSchema);
