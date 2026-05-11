import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import EvolutionNote from "@/models/EvolutionNote";
import Clarification from "@/models/Clarification";
import {
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

    const notaId = request.nextUrl.searchParams.get("notaId")?.trim();
    if (!notaId) {
      return NextResponse.json(
        { error: "Falta el parámetro notaId." },
        { status: 400 }
      );
    }

    if (!isValidObjectId(notaId)) {
      return NextResponse.json(
        { error: "notaId no es un identificador válido." },
        { status: 400 }
      );
    }

    const lista = await Clarification.find({ notaOriginal: notaId })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(lista);
  } catch (err) {
    console.error("GET /api/clarifications:", err);
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

    const notaOriginalId =
      typeof body.notaOriginalId === "string"
        ? body.notaOriginalId.trim()
        : "";
    const medicoRaw = typeof body.medico === "string" ? body.medico : "";
    const contenidoRaw =
      typeof body.contenido === "string" ? body.contenido : "";

    if (!notaOriginalId || !medicoRaw.trim() || !contenidoRaw.trim()) {
      return NextResponse.json(
        { error: "Faltan notaOriginalId, medico o contenido." },
        { status: 400 }
      );
    }

    if (!isValidObjectId(notaOriginalId)) {
      return NextResponse.json(
        { error: "notaOriginalId no es un identificador válido." },
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

    const existeNota = await EvolutionNote.findById(notaOriginalId).select("_id");
    if (!existeNota) {
      return NextResponse.json(
        { error: "Nota original no encontrada." },
        { status: 404 }
      );
    }

    const doc = await Clarification.create({
      notaOriginal: notaOriginalId,
      medico,
      contenido,
    });

    const conPopulate = await Clarification.findById(doc._id)
      .populate({
        path: "notaOriginal",
        select: "contenido createdAt",
      })
      .lean();

    return NextResponse.json(conPopulate, { status: 201 });
  } catch (err) {
    if (err.name === "ValidationError") {
      return NextResponse.json(
        { error: validationOrGenericMessage(err) },
        { status: 400 }
      );
    }
    console.error("POST /api/clarifications:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
