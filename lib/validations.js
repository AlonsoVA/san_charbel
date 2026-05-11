const mongoose = require("mongoose");

const SEVERIDAD_ETIQUETA = {
  leve: "LEVE",
  moderada: "MODERADA",
  severa: "SEVERA",
};

function isValidObjectId(id) {
  if (id === undefined || id === null) return false;
  return mongoose.Types.ObjectId.isValid(String(id));
}

function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return str.trim().replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Construye textos de alerta para el médico a partir del array `alergias` del paciente.
 * @param {Array<{ sustancia: string, severidad: string, notas?: string }>} alergias
 * @returns {string[]}
 */
function buildAllergyAlerts(alergias) {
  if (!Array.isArray(alergias) || alergias.length === 0) return [];

  return alergias.map((a) => {
    const sevRaw = a && a.severidad != null ? String(a.severidad) : "";
    const sev =
      SEVERIDAD_ETIQUETA[sevRaw] || sevRaw.toUpperCase();
    const substancia = a && a.sustancia != null ? String(a.sustancia).trim() : "";
    let msg = `⚠️ Alergia ${sev} a ${substancia}`;
    const notas = a && a.notas != null ? String(a.notas).trim() : "";
    if (notas) {
      msg += `: ${notas}`;
    }
    return msg;
  });
}

module.exports = {
  isValidObjectId,
  sanitizeString,
  buildAllergyAlerts,
};
