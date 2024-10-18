import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

/* 
// Seed the Departments table with a few sample departments
async function main() {
  // Seed the Departments table with a few sample departments
  const departments = await prisma.departments.createMany({
    data: [
      {
        name: 'Neurologimottagningen Drottning silvias barnsjukhus SU',
        address: 'Smörslottsgatan 23',
        phonenumber: 0o313436300,
      },
      {
        name: 'Ortopedimottagningen Drottning silvias barnsjukhus SU',
        address: 'Smörslottsgatan 23',
        phonenumber: 0o313424000,
      },
      {
        name: 'Barnkardiologimottagningen Drottning silvias barnsjukhus SU',
        address: 'Smörslottsgatan 23',
        phonenumber: 0o313424000,
      },
      {
        name: 'Kirurgimottagningen Drottning silvias barnsjukhus SU',
        address: 'Smörslottsgatan 23',
        phonenumber: 0o313424000,
      },
      {
        name: 'Ögonmottagningen Drottning silvias barnsjukhus SU',
        address: 'Smörslottsgatan 23',
        phonenumber: 0o313424000,
      },
      {
        name: 'ÖNH Drottning silvias barnsjukhus SU',
        address: 'Smörslottsgatan 23',
        phonenumber: 0o313424000,
      },
      {
        name: 'Sjukhusclownerna Drottning silvias barnsjukhus SU',
        address: 'Smörslottsgatan 23',
        phonenumber: 0o313424000,
      },
      {
        name: 'Ronald Mcdonald house SU/Ö',
        address: 'Smörslottsgatan 23',
        phonenumber: 0o313424000,
      },
    ],
  });

  // Seed the Staff table with sample staff data
  const occupations = ['Doktor', 'Sjuksköterska', 'Rehabilitering', 'Psykolog', 'Vårdenhetschef'];

  for (let i = 0; i < 30; i++) {
    await prisma.staff.create({
      data: {
        staff_name: faker.name.fullName(),
        staff_occupation: occupations[Math.floor(Math.random() * occupations.length)],
      },
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
}); */



// Assign the staffs to the departments junction table, and profiles to the profilesDepartments junction table
async function main() {
  // Fetch the existing Departments, Staff, and Profiles
  const departments = await prisma.departments.findMany();
  const staffMembers = await prisma.staff.findMany();
  const profiles = await prisma.profiles.findMany();  

  // ======== ASSIGN STAFF TO DEPARTMENTS ======== //
  
  // Calculate the number of staff members per department (as evenly distributed as possible)
  const totalStaff = staffMembers.length;
  const totalDepartments = departments.length;
  const staffPerDepartment = Math.floor(totalStaff / totalDepartments); 
  let remainingStaff = totalStaff % totalDepartments; 

  // Assign staff to each department
  let assignedStaffIndex = 0;

  for (const department of departments) {
    const numberOfStaffToAssign = staffPerDepartment + (remainingStaff > 0 ? 1 : 0); // Give extra staff if remaining
    remainingStaff > 0 && remainingStaff--; // Reduce remaining staff count

    const staffToAssign = staffMembers.slice(assignedStaffIndex, assignedStaffIndex + numberOfStaffToAssign);

    // Create records in the DepartmentStaff junction table
    for (const staff of staffToAssign) {
      await prisma.departmentsStaff.create({
        data: {
          department_id: department.id,
          staff_id: staff.id,
        },
      });
    }

    assignedStaffIndex += numberOfStaffToAssign; // Move index forward for the next department
  }

  // ======== ASSIGN PROFILES TO DEPARTMENTS ======== //
  
  // Calculate the number of profiles per department (as evenly distributed as possible)
  const totalProfiles = profiles.length;
  const profilesPerDepartment = Math.floor(totalProfiles / totalDepartments); // Base number of profiles per department
  let remainingProfiles = totalProfiles % totalDepartments; // Profiles to be distributed randomly among departments

  // Assign profiles to each department
  let assignedProfileIndex = 0;

  for (const department of departments) {
    const numberOfProfilesToAssign = profilesPerDepartment + (remainingProfiles > 0 ? 1 : 0); // Extra profiles if remaining
    remainingProfiles > 0 && remainingProfiles--; // Reduce remaining profiles count

    const profilesToAssign = profiles.slice(assignedProfileIndex, assignedProfileIndex + numberOfProfilesToAssign);

    // Create records in the ProfilesDepartments junction table
    for (const profile of profilesToAssign) {
      await prisma.profilesDepartments.create({
        data: {
          department_id: department.id,
          profile_id: profile.id,
        },
      });
    }

    assignedProfileIndex += numberOfProfilesToAssign; // Move index forward for the next department
  }

  console.log('Staff and profiles have been successfully assigned to departments.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });