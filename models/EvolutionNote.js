const mongoose = require("mongoose");

const INMUTABLE_MSG =
  "Las notas de evolución son inmutables. Para rectificar información, crea una nota aclaratoria.";

function inmutabilidadError() {
  return new Error(INMUTABLE_MSG);
}

const evolutionNoteSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    medico: {
      type: String,
      required: true,
      trim: true,
    },
    contenido: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    alertasMostradasAlMedico: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

evolutionNoteSchema.pre("save", function () {
  if (!this.isNew) {
    throw inmutabilidadError();
  }
});

const queryImmutOps = {
  document: false,
  query: true,
};

evolutionNoteSchema.pre("findOneAndUpdate", queryImmutOps, function () {
  throw inmutabilidadError();
});

evolutionNoteSchema.pre("updateOne", queryImmutOps, function () {
  throw inmutabilidadError();
});

evolutionNoteSchema.pre("updateMany", queryImmutOps, function () {
  throw inmutabilidadError();
});

module.exports =
  mongoose.models.EvolutionNote ||
  mongoose.model("EvolutionNote", evolutionNoteSchema);
