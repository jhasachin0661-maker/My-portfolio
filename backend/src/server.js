import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { prisma } from './db.js';
import { clearAuthCookie, requireAuth, setAuthCookie, signAdmin } from './auth.js';
import { loginSchema, contactSchema, projectSchema, skillSchema, journeySchema, buildSchema, labSchema, settingsSchema } from './validation.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
const app = express();
const port = Number(process.env.PORT || 4000);
const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: frontend,
    credentials: true
  })
);
const mailer = process.env.SMTP_USER && process.env.SMTP_PASS
	? nodemailer.createTransport(process.env.SMTP_SERVICE
		? { service: process.env.SMTP_SERVICE, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
		: { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
	: null;

app.use(helmet());
app.use(cors({ origin: frontend, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));

const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, message: { error: 'Too many contact submissions. Try again later.' } });
const parse = (schema, req, res) => { const result = schema.safeParse(req.body); if (!result.success) { res.status(400).json({ error: 'Please check the highlighted fields.', details: result.error.flatten().fieldErrors }); return null; } return result.data; };

const bootedAt = Date.now();
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'portfolio-api', uptimeSeconds: Math.round((Date.now() - bootedAt) / 1000) }));
app.get('/api/status', async (_, res, next) => { try { const [projects, build] = await Promise.all([prisma.project.count(), prisma.currentBuild.findFirst()]); res.json({ system: 'ONLINE', api: 'ONLINE', projects, currentBuild: build ? { name: build.name, status: build.status } : null }); } catch (e) { next(e); } });
app.post('/api/auth/login', async (req, res, next) => { try { const data = parse(loginSchema, req, res); if (!data) return; const admin = await prisma.admin.findUnique({ where: { email: data.email.toLowerCase() } }); if (!admin || !(await bcrypt.compare(data.password, admin.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' }); setAuthCookie(res, signAdmin(admin.id)); res.json({ ok: true }); } catch (e) { next(e); } });
app.post('/api/auth/logout', (_, res) => { clearAuthCookie(res); res.json({ ok: true }); });
app.get('/api/auth/me', requireAuth, async (req, res, next) => { try { const admin = await prisma.admin.findUnique({ where: { id: req.user.sub }, select: { id: true, email: true } }); if (!admin) return res.status(401).json({ error: 'Session no longer valid' }); res.json(admin); } catch (e) { next(e); } });

app.get('/api/projects', async (_, res, next) => { try { res.json(await prisma.project.findMany({ orderBy: { number: 'asc' } })); } catch (e) { next(e); } });
app.get('/api/projects/:id', async (req, res, next) => { try { const item = await prisma.project.findUnique({ where: { id: req.params.id } }); if (!item) return res.status(404).json({ error: 'Project not found' }); res.json(item); } catch (e) { next(e); } });
app.post('/api/projects', requireAuth, async (req, res, next) => { try { const data = parse(projectSchema, req, res); if (!data) return; res.status(201).json(await prisma.project.create({ data })); } catch (e) { next(e); } });
app.put('/api/projects/:id', requireAuth, async (req, res, next) => { try { const data = parse(projectSchema, req, res); if (!data) return; res.json(await prisma.project.update({ where: { id: req.params.id }, data })); } catch (e) { next(e); } });
app.delete('/api/projects/:id', requireAuth, async (req, res, next) => { try { await prisma.project.delete({ where: { id: req.params.id } }); res.status(204).end(); } catch (e) { next(e); } });

app.get('/api/skills', async (_, res, next) => { try { res.json(await prisma.skill.findMany({ orderBy: [{ category: 'asc' }, { order: 'asc' }] })); } catch (e) { next(e); } });
app.post('/api/skills', requireAuth, async (req, res, next) => { try { const data = parse(skillSchema, req, res); if (!data) return; res.status(201).json(await prisma.skill.create({ data })); } catch (e) { next(e); } });
app.put('/api/skills/:id', requireAuth, async (req, res, next) => { try { const data = parse(skillSchema, req, res); if (!data) return; res.json(await prisma.skill.update({ where: { id: req.params.id }, data })); } catch (e) { next(e); } });
app.delete('/api/skills/:id', requireAuth, async (req, res, next) => { try { await prisma.skill.delete({ where: { id: req.params.id } }); res.status(204).end(); } catch (e) { next(e); } });

app.get('/api/journey', async (_, res, next) => { try { res.json(await prisma.journey.findMany({ orderBy: { order: 'asc' } })); } catch (e) { next(e); } });
app.post('/api/journey', requireAuth, async (req, res, next) => { try { const data = parse(journeySchema, req, res); if (!data) return; res.status(201).json(await prisma.journey.create({ data })); } catch (e) { next(e); } });
app.put('/api/journey/:id', requireAuth, async (req, res, next) => { try { const data = parse(journeySchema, req, res); if (!data) return; res.json(await prisma.journey.update({ where: { id: req.params.id }, data })); } catch (e) { next(e); } });
app.delete('/api/journey/:id', requireAuth, async (req, res, next) => { try { await prisma.journey.delete({ where: { id: req.params.id } }); res.status(204).end(); } catch (e) { next(e); } });

app.get('/api/current-build', async (_, res, next) => { try { const item = await prisma.currentBuild.findFirst(); if (!item) return res.status(404).json({ error: 'Current build not configured' }); res.json(item); } catch (e) { next(e); } });
app.put('/api/current-build', requireAuth, async (req, res, next) => { try { const data = parse(buildSchema, req, res); if (!data) return; const existing = await prisma.currentBuild.findFirst(); const item = existing ? await prisma.currentBuild.update({ where: { id: existing.id }, data }) : await prisma.currentBuild.create({ data }); res.json(item); } catch (e) { next(e); } });

app.get('/api/lab', async (_, res, next) => { try { res.json(await prisma.labExperiment.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })); } catch (e) { next(e); } });
app.post('/api/lab', requireAuth, async (req, res, next) => { try { const data = parse(labSchema, req, res); if (!data) return; res.status(201).json(await prisma.labExperiment.create({ data })); } catch (e) { next(e); } });
app.put('/api/lab/:id', requireAuth, async (req, res, next) => { try { const data = parse(labSchema, req, res); if (!data) return; res.json(await prisma.labExperiment.update({ where: { id: req.params.id }, data })); } catch (e) { next(e); } });
app.delete('/api/lab/:id', requireAuth, async (req, res, next) => { try { await prisma.labExperiment.delete({ where: { id: req.params.id } }); res.status(204).end(); } catch (e) { next(e); } });

app.get('/api/settings', async (_, res, next) => { try { const existing = await prisma.siteSettings.findFirst(); res.json(existing || {}); } catch (e) { next(e); } });
app.put('/api/settings', requireAuth, async (req, res, next) => { try { const data = parse(settingsSchema, req, res); if (!data) return; const existing = await prisma.siteSettings.findFirst(); const item = existing ? await prisma.siteSettings.update({ where: { id: existing.id }, data }) : await prisma.siteSettings.create({ data }); res.json(item); } catch (e) { next(e); } });

app.post('/api/contact', contactLimiter, async (req, res, next) => {
	try {
		const data = parse(contactSchema, req, res);
		if (!data) return;
		const message = await prisma.contactMessage.create({ data });
		let emailSent = false;
		if (mailer) {
			try {
				await mailer.sendMail({
					from: process.env.SMTP_FROM || process.env.SMTP_USER,
					to: process.env.CONTACT_EMAIL || 'jhasachin0661@gmail.com',
					replyTo: data.email,
					subject: `[Portfolio] ${data.subject}`,
					text: `New message from ${data.name} <${data.email}>\n\n${data.message}`,
				});
				emailSent = true;
			} catch (emailError) {
				console.error('Contact email delivery failed:', emailError.message);
			}
		}
		res.status(201).json({ ok: true, id: message.id, emailSent });
	} catch (e) { next(e); }
});
app.get('/api/messages', requireAuth, async (_, res, next) => { try { res.json(await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { next(e); } });
app.patch('/api/messages/:id/read', requireAuth, async (req, res, next) => { try { const current = await prisma.contactMessage.findUnique({ where: { id: req.params.id } }); if (!current) return res.status(404).json({ error: 'Message not found' }); res.json(await prisma.contactMessage.update({ where: { id: req.params.id }, data: { read: !current.read } })); } catch (e) { next(e); } });
app.delete('/api/messages/:id', requireAuth, async (req, res, next) => { try { await prisma.contactMessage.delete({ where: { id: req.params.id } }); res.status(204).end(); } catch (e) { next(e); } });

app.use((err, _req, res, _next) => { console.error(err); const status = err.code === 'P2002' ? 409 : err.code === 'P2025' ? 404 : 500; res.status(status).json({ error: status === 500 ? 'Internal server error' : 'Request could not be completed' }); });

app.listen(port, () => console.log(`Portfolio API running on http://localhost:${port}`));
