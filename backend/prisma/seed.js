import 'dotenv/config';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Admin credentials are environment-driven. If ADMIN_PASSWORD is not set, a
// random one-time password is generated and printed once so no weak default
// credential is ever baked into a production deployment.
const adminEmail = process.env.ADMIN_EMAIL || 'admin@portfolio.local';
const generatedPassword = crypto.randomBytes(9).toString('base64url');
const adminPassword = process.env.ADMIN_PASSWORD || generatedPassword;
const usingGenerated = !process.env.ADMIN_PASSWORD;

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.admin.upsert({ where: { email: adminEmail }, update: { passwordHash }, create: { email: adminEmail, passwordHash } });

  await prisma.project.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.journey.deleteMany();
  await prisma.currentBuild.deleteMany();

  await prisma.project.createMany({ data: [
    {
      number: 1,
      name: 'AWS — Automatic Weather Station Anomaly Detection',
      slug: 'aws-weather-anomaly-detection',
      description: 'An AI-powered weather monitoring system designed to detect abnormal or faulty sensor readings from Automatic Weather Stations.',
      details: 'The system analyzes temperature, humidity, pressure, rainfall, wind and solar radiation to identify readings that may not represent actual weather conditions.',
      problem: 'Automatic Weather Stations regularly produce faulty or abnormal sensor readings — caused by hardware drift, environmental interference, or sensor failure — that quietly corrupt downstream weather data if left undetected.',
      solution: 'Built a data pipeline that ingests temperature, humidity, pressure, rainfall, wind and solar-radiation readings and applies anomaly-detection techniques to flag values that fall outside expected physical or statistical ranges, surfacing them through a simple web interface.',
      challenges: 'Balancing sensitivity so genuine extreme-weather events are not flagged as false anomalies, while still catching real sensor faults.',
      learnings: 'Hands-on experience turning raw multi-sensor time-series data into a usable, explainable detection system rather than a black-box model.',
      stack: 'Python · AI/ML · Data Analysis · Web',
      tags: 'AI/ML,Data,Full Stack',
      status: 'Built',
      year: '2026',
      liveUrl: 'https://3000-iic5qf7ns4t354u999xu6-82b888ba.sandbox.novita.ai/',
      featured: true,
    },
    {
      number: 2,
      name: 'KisanSeva — Building for Indian Farmers',
      slug: 'kisanseva',
      description: 'A platform currently being developed to make useful digital tools and information more accessible to Indian farmers.',
      details: 'The goal is to combine a simple user experience with technology that can solve practical agricultural problems.',
      problem: 'Indian farmers often lack easy, centralized access to the digital tools and information that could help them make better day-to-day decisions.',
      solution: 'Designing a full-stack platform — React frontend, Node.js/API backend, with AI-assisted features — focused on a simple, accessible user experience rather than a feature-heavy dashboard.',
      challenges: 'Keeping the interface simple enough for varied technical comfort levels while still being genuinely useful.',
      learnings: 'In active development — details will be added here as the build progresses.',
      stack: 'React · Node.js · APIs · AI',
      tags: 'Full Stack,AI/ML',
      status: 'Currently Building',
      year: '2026',
      featured: true,
    },
  ]});

  await prisma.skill.createMany({ data: [
    { category: 'Frontend', name: 'HTML', description: 'Semantic web structure', order: 1 },
    { category: 'Frontend', name: 'CSS', description: 'Responsive visual systems', order: 2 },
    { category: 'Frontend', name: 'JavaScript', description: 'Interactive web applications', order: 3 },
    { category: 'Frontend', name: 'React', description: 'Component-driven interfaces', order: 4 },
    { category: 'Frontend', name: 'Responsive UI', description: 'Interfaces that adapt across devices', order: 5 },
    { category: 'Backend', name: 'Node.js', description: 'Server-side JavaScript', order: 1 },
    { category: 'Backend', name: 'REST APIs', description: 'Connected application services', order: 2 },
    { category: 'Backend', name: 'Authentication', description: 'Protected application access', order: 3 },
    { category: 'Backend', name: 'API Integration', description: 'Connecting external and internal services', order: 4 },
    { category: 'Database', name: 'SQL / NoSQL fundamentals', description: 'Data modeling and persistence', order: 1 },
    { category: 'Database', name: 'Database integration', description: 'Applications backed by real data', order: 2 },
    { category: 'AI / Data', name: 'Python', description: 'Data and AI development', order: 1 },
    { category: 'AI / Data', name: 'AI/ML fundamentals', description: 'Core machine learning concepts', order: 2 },
    { category: 'AI / Data', name: 'Anomaly Detection', description: 'Finding abnormal data patterns', order: 3 },
    { category: 'AI / Data', name: 'Data-driven applications', description: 'Turning data into useful systems', order: 4 },
    { category: 'Tools', name: 'Git', description: 'Version control', order: 1 },
    { category: 'Tools', name: 'GitHub', description: 'Code collaboration and hosting', order: 2 },
    { category: 'Tools', name: 'VS Code', description: 'Development environment', order: 3 },
    { category: 'Tools', name: 'API testing & development tools', description: 'Testing and API workflows', order: 4 }
  ]});

  await prisma.journey.createMany({ data: [
    { period: '2025', title: 'Started Building', description: 'Began exploring web development, programming and turning ideas into real projects.', order: 1 },
    { period: '2025–2026', title: 'Full Stack & AI Exploration', description: 'Started working across frontend, backend, APIs and AI-powered applications while building practical projects.', order: 2 },
    { period: '2026', title: 'Building Real Products', description: 'Focused on creating complete, functional systems rather than isolated demos.', order: 3 },
    { period: '2026', title: 'KisanSeva', description: 'Started building KisanSeva with a focus on technology for Indian farmers.', order: 4 }
  ]});

  await prisma.currentBuild.create({ data: { name: 'KisanSeva', status: 'IN DEVELOPMENT', description: 'A practical digital platform for Indian farmers, focused on making technology, information and useful services easier to access.', stack: 'React · Node.js · APIs · AI', objective: 'Combine a simple user experience with technology that can solve practical agricultural problems.', buildPhase: 'Backend + Frontend' } });

  // Engineering Lab intentionally starts empty — experiments are added through
  // the admin CMS as they actually exist, rather than seeding fabricated demos.

  await prisma.siteSettings.deleteMany();
  await prisma.siteSettings.create({ data: {
    name: 'Sachin Jha',
    role: 'Full Stack Developer / Frontend Developer',
    tagline: 'Building digital systems that feel alive.',
    location: 'India',
    email: 'jhasachin0661@gmail.com',
    github: 'https://github.com/jhasachin0661-maker',
    linkedin: 'https://www.linkedin.com/in/sachin-jha-a4b504281/',
    resumeUrl: null,
    availability: 'Available for opportunities',
  }});

  console.log('\n--- Portfolio seed complete ---');
  console.log(`Admin email: ${adminEmail}`);
  if (usingGenerated) {
    console.log(`Admin password (generated, shown once): ${adminPassword}`);
    console.log('Set ADMIN_EMAIL / ADMIN_PASSWORD in your .env before re-seeding to use your own credentials.');
  } else {
    console.log('Admin password: set via ADMIN_PASSWORD in your .env');
  }
  console.log('---------------------------------\n');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
