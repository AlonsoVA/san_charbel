const mongoose = require("mongoose");

const INMUTABLE_MSG =
  "Las notas de evolución y aclaratorias son inmutables. No se permiten modificaciones.";

function inmutabilidadError() {
  return new Error(INMUTABLE_MSG);
}

const clarificationSchema = new mongoose.Schema(
  {
    notaOriginal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EvolutionNote",
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
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

clarificationSchema.pre("save", function () {
  if (!this.isNew) {
    throw inmutabilidadError();
  }
});

const queryImmutOps = {
  document: false,
  query: true,
};

clarificationSchema.pre("findOneAndUpdate", queryImmutOps, function () {
  throw inmutabilidadError();
});

clarificationSchema.pre("updateOne", queryImmutOps, function () {
  throw inmutabilidadError();
});

clarificationSchema.pre("updateMany", queryImmutOps, function () {
  throw inmutabilidadError();
});

module.exports =
  mongoose.models.Clarification ||
  mongoose.model("Clarification", clarificationSchema);
