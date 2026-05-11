import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/models/patient";

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

    const search = request.nextUrl.searchParams.get("search")?.trim();

    let query = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      query = {
        $or: [{ nombre: rx }, { numeroExpediente: rx }],
      };
    }

    const pacientes = await Patient.find(query).lean();
    return NextResponse.json(pacientes);
  } catch (err) {
    console.error("GET /api/patients:", err);
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

    const payload = {
      nombre: typeof body.nombre === "string" ? body.nombre.trim() : "",
      telefono: typeof body.telefono === "string" ? body.telefono.trim() : "",
      correo: typeof body.correo === "string" ? body.correo.trim() : "",
      numeroExpediente:
        typeof body.numeroExpediente === "string"
          ? body.numeroExpediente.trim()
          : "",
      fechaCumpleanos: body.fechaCumpleanos,
      alergias: Array.isArray(body.alergias) ? body.alergias : [],
    };

    if (!payload.nombre || !payload.telefono || !payload.correo) {
      return NextResponse.json(
        { error: "Faltan nombre, teléfono o correo." },
        { status: 400 }
      );
    }
    if (!payload.numeroExpediente) {
      return NextResponse.json(
        { error: "Falta numeroExpediente." },
        { status: 400 }
      );
    }
    if (payload.fechaCumpleanos == null || payload.fechaCumpleanos === "") {
      return NextResponse.json(
        { error: "Falta fechaCumpleanos." },
        { status: 400 }
      );
    }

    const fecha = new Date(payload.fechaCumpleanos);
    if (Number.isNaN(fecha.getTime())) {
      return NextResponse.json(
        { error: "fechaCumpleanos no es una fecha válida." },
        { status: 400 }
      );
    }

    for (let i = 0; i < payload.alergias.length; i += 1) {
      const al = payload.alergias[i];
      if (!al || typeof al.sustancia !== "string" || !al.sustancia.trim()) {
        return NextResponse.json(
          {
            error: `Cada alergia debe incluir sustancia (índice ${i}).`,
          },
          { status: 400 }
        );
      }
      if (!["leve", "moderada", "severa"].includes(al.severidad)) {
        return NextResponse.json(
          {
            error: `severidad inválida en alergia índice ${i} (use leve, moderada o severa).`,
          },
          { status: 400 }
        );
      }
    }

    const paciente = await Patient.create({
      nombre: payload.nombre,
      telefono: payload.telefono,
      correo: payload.correo.toLowerCase(),
      numeroExpediente: payload.numeroExpediente,
      fechaCumpleanos: fecha,
      alergias: payload.alergias.map((a) => ({
        sustancia: a.sustancia.trim(),
        severidad: a.severidad,
        notas:
          typeof a.notas === "string" && a.notas.trim() ? a.notas.trim() : "",
      })),
    });

    return NextResponse.json(paciente.toObject(), { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "Ya existe un paciente con ese numeroExpediente." },
        { status: 409 }
      );
    }
    if (err.name === "ValidationError") {
      return NextResponse.json(
        { error: validationOrGenericMessage(err) },
        { status: 400 }
      );
    }
    console.error("POST /api/patients:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
