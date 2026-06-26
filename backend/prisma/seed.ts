import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cargando datos de prueba...');

  // Upsert: si ya existen no falla
  const clinica = await prisma.especialidad.upsert({
    where: { nombre: 'Clínica Médica' },
    update: {},
    create: { nombre: 'Clínica Médica' },
  });
  const pediatria = await prisma.especialidad.upsert({
    where: { nombre: 'Pediatría' },
    update: {},
    create: { nombre: 'Pediatría' },
  });
  const cardiologia = await prisma.especialidad.upsert({
    where: { nombre: 'Cardiología' },
    update: {},
    create: { nombre: 'Cardiología' },
  });
  const traumatologia = await prisma.especialidad.upsert({
    where: { nombre: 'Traumatología' },
    update: {},
    create: { nombre: 'Traumatología' },
  });
  const dermatologia = await prisma.especialidad.upsert({
    where: { nombre: 'Dermatología' },
    update: {},
    create: { nombre: 'Dermatología' },
  });
  await prisma.especialidad.upsert({
    where: { nombre: 'Neurología' },
    update: {},
    create: { nombre: 'Neurología' },
  });
  await prisma.especialidad.upsert({
    where: { nombre: 'Oftalmología' },
    update: {},
    create: { nombre: 'Oftalmología' },
  });

  console.log('Especialidades listas');

  const drGarcia = await prisma.medico.upsert({
    where: { matricula: 'MP-12345' },
    update: {},
    create: { nombre: 'Ana', apellido: 'García', matricula: 'MP-12345', especialidadId: clinica.id },
  });
  const drMartinez = await prisma.medico.upsert({
    where: { matricula: 'MP-12346' },
    update: {},
    create: { nombre: 'Carlos', apellido: 'Martínez', matricula: 'MP-12346', especialidadId: clinica.id },
  });
  const drLopez = await prisma.medico.upsert({
    where: { matricula: 'MP-22345' },
    update: {},
    create: { nombre: 'María', apellido: 'López', matricula: 'MP-22345', especialidadId: pediatria.id },
  });
  await prisma.medico.upsert({
    where: { matricula: 'MP-33456' },
    update: {},
    create: { nombre: 'Roberto', apellido: 'Fernández', matricula: 'MP-33456', especialidadId: cardiologia.id },
  });
  await prisma.medico.upsert({
    where: { matricula: 'MP-44567' },
    update: {},
    create: { nombre: 'Laura', apellido: 'Díaz', matricula: 'MP-44567', especialidadId: traumatologia.id },
  });
  await prisma.medico.upsert({
    where: { matricula: 'MP-55678' },
    update: {},
    create: { nombre: 'Sebastián', apellido: 'Romero', matricula: 'MP-55678', especialidadId: dermatologia.id },
  });

  console.log('Médicos listos');

  const adminHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {},
    create: {
      email: 'admin@hospital.com',
      password: adminHash,
      nombre: 'Ivan',
      apellido: 'Cab',
      dni: '99999999',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  // Admin con email cortito y fácil de tipear para las demos
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      password: adminHash,
      nombre: 'Admin',
      apellido: 'General',
      dni: '11111111',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  // Médico con login propio, vinculado a la ficha de la Dra. García
  const medicoHash = await bcrypt.hash('medico123', 12);
  const medicoUser = await prisma.user.upsert({
    where: { email: 'medico@hospital.com' },
    update: {},
    create: {
      email: 'medico@hospital.com',
      password: medicoHash,
      nombre: 'Ana',
      apellido: 'García',
      dni: '27000001',
      role: 'MEDICO',
      emailVerified: true,
    },
  });
  await prisma.medico.update({ where: { id: drGarcia.id }, data: { userId: medicoUser.id } });

  const pacienteHash = await bcrypt.hash('test123', 12);
  const paciente = await prisma.user.upsert({
    where: { email: 'paciente@test.com' },
    update: {},
    create: {
      email: 'paciente@test.com',
      password: pacienteHash,
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '30123456',
      telefono: '11 2345-6789',
      role: 'PATIENT',
      emailVerified: true,
    },
  });

  console.log('Usuarios listos:');
  console.log('  admin@admin.com / admin123      (admin)');
  console.log('  admin@hospital.com / admin123   (admin)');
  console.log('  medico@hospital.com / medico123 (médico)');
  console.log('  paciente@test.com / test123     (paciente)');

  // Solo crear turnos de ejemplo si el paciente no tiene ninguno aún
  const turnosExistentes = await prisma.turno.count({ where: { pacienteId: paciente.id } });
  if (turnosExistentes === 0) {
    const hoy = new Date();
    const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
    const pasado = new Date(hoy); pasado.setDate(hoy.getDate() + 3);

    await prisma.turno.createMany({
      data: [
        { pacienteId: paciente.id, medicoId: drGarcia.id,   fecha: manana, hora: '09:00', motivo: 'Control general',    status: 'PENDIENTE' },
        { pacienteId: paciente.id, medicoId: drLopez.id,    fecha: pasado, hora: '14:30', motivo: 'Dolor de garganta',  status: 'CONFIRMADO' },
        { pacienteId: paciente.id, medicoId: drMartinez.id, fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7), hora: '10:00', motivo: 'Chequeo anual', status: 'COMPLETADO', notas: 'Todo en orden. Próximo control en 6 meses.' },
      ],
    });

    await prisma.receta.createMany({
      data: [
        { pacienteId: paciente.id, medicoId: drGarcia.id,   medicamento: 'Ibuprofeno 400mg',   dosis: '1 comprimido cada 8 horas',   indicacion: 'Tomar después de las comidas durante 5 días' },
        { pacienteId: paciente.id, medicoId: drMartinez.id, medicamento: 'Amoxicilina 500mg',  dosis: '1 cápsula cada 12 horas',      indicacion: 'Completar el tratamiento de 7 días. No suspender.' },
      ],
    });

    console.log('Datos de ejemplo creados');
  } else {
    console.log('El paciente ya tiene datos — seed omite turnos/recetas de ejemplo');
  }

  console.log('\n✓ Seed completado correctamente\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
