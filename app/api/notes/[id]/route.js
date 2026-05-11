import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import EvolutionNote from "@/models/EvolutionNote";
import Clarification from "@/models/Clarification";
import { isValidObjectId } from "@/lib/validations";

const MENSAJE_405_NOTA =
  "Las notas de evolución son inmutables. Para rectificar información, crea una nota aclaratoria.";

export async function GET(request, context) {
  try {
    await connectDB();

    const params = await context.params;
    const rawId = params?.id;
    const id = typeof rawId === "string" ? rawId.trim() : "";

    if (!id) {
      return NextResponse.json(
        { error: "Falta el id de la nota." },
        { status: 400 }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "El id de la nota no es válido." },
        { status: 400 }
      );
    }

    const nota = await EvolutionNote.findById(id)
      .populate({
        path: "paciente",
        select: "nombre numeroExpediente alergias",
      })
      .lean();

    if (!nota) {
      return NextResponse.json(
        { error: "Nota no encontrada." },
        { status: 404 }
      );
    }

    const clarificaciones = await Clarification.find({ notaOriginal: id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ ...nota, clarificaciones });
  } catch (err) {
    console.error("GET /api/notes/[id]:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function PUT() {
  return NextResponse.json(
    { error: MENSAJE_405_NOTA },
    {
      status: 405,
      headers: { Allow: "GET" },
    }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: MENSAJE_405_NOTA },
    {
      status: 405,
      headers: { Allow: "GET" },
    }
  );
}
