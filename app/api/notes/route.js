import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/models/patient";
import EvolutionNote from "@/models/EvolutionNote";
import Clarification from "@/models/Clarification";
import {
  buildAllergyAlerts,
  isValidObjectId,
  sanitizeString,
} from "@/lib/validations";

function validationOrGenericMessage(err) {
  if (err.name === "ValidationError" && err.errors) {
    const first = Object.values(err.errors)[0];
    if (first?.message) return first.message;
  }
  return err.message || "Error de validación";
}

export async function GET(request) {
  try {
    await connectDB();

    const pacienteId = request.nextUrl.searchParams.get("pacienteId")?.trim();
    if (!pacienteId) {
      return NextResponse.json(
        { error: "Falta el parámetro pacienteId." },
        { status: 400 }
      );
    }

    if (!isValidObjectId(pacienteId)) {
      return NextResponse.json(
        { error: "pacienteId no es un identificador válido." },
        { status: 400 }
      );
    }

    const notas = await EvolutionNote.find({ paciente: pacienteId })
      .populate({
        path: "paciente",
        select: "nombre numeroExpediente",
      })
      .sort({ createdAt: -1 })
      .lean();

    const ids = notas.map((n) => n._id);
    const clarDocs = await Clarification.find({
      notaOriginal: { $in: ids },
    })
      .sort({ createdAt: 1 })
      .lean();

    const porNota = new Map();
    for (const c of clarDocs) {
      const key = String(c.notaOriginal);
      if (!porNota.has(key)) porNota.set(key, []);
      porNota.get(key).push(c);
    }

    const resultado = notas.map((n) => ({
      ...n,
      clarificaciones: porNota.get(String(n._id)) ?? [],
    }));

    return NextResponse.json(resultado);
  } catch (err) {
    console.error("GET /api/notes:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const pacienteId =
      typeof body.pacienteId === "string" ? body.pacienteId.trim() : "";
    const medicoRaw =
      typeof body.medico === "string" ? body.medico : "";
    const contenidoRaw =
      typeof body.contenido === "string" ? body.contenido : "";

    if (!pacienteId || !medicoRaw.trim() || !contenidoRaw.trim()) {
      return NextResponse.json(
        { error: "Faltan pacienteId, medico o contenido." },
        { status: 400 }
      );
    }

    if (!isValidObjectId(pacienteId)) {
      return NextResponse.json(
        { error: "pacienteId no es un identificador válido." },
        { status: 400 }
      );
    }

    const medico = sanitizeString(medicoRaw);
    const contenido = sanitizeString(contenidoRaw);

    if (!medico || !contenido) {
      return NextResponse.json(
        { error: "medico y contenido no pueden quedar vacíos." },
        { status: 400 }
      );
    }

    const paciente = await Patient.findById(pacienteId).lean();
    if (!paciente) {
      return NextResponse.json(
        { error: "Paciente no encontrado." },
        { status: 404 }
      );
    }

    const alertasMostradasAlMedico = buildAllergyAlerts(paciente.alergias || []);

    const nota = await EvolutionNote.create({
      paciente: pacienteId,
      medico,
      contenido,
      alertasMostradasAlMedico,
    });

    const resultado = nota.toObject();
    return NextResponse.json(resultado, { status: 201 });
  } catch (err) {
    if (err.name === "ValidationError") {
      return NextResponse.json(
        { error: validationOrGenericMessage(err) },
        { status: 400 }
      );
    }
    console.error("POST /api/notes:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
