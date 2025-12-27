// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getConfig, setConfig } from '@/utils/configEngine'
import { logAudit } from '@/utils/logs'
import { withPermissionCheck } from '@/utils/permissionsManager'
type Data = {
	success: boolean
	error?: string
	widgets?: string[]
	coverImage?: string | null
}

export const config = {
	api: {
		bodyParser: {
			sizeLimit: '50mb',
		},
	},
};

export default withPermissionCheck(handler, 'admin');

export async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	if (req.method !== 'PATCH') return res.status(405).json({ success: false, error: 'Method not allowed' })
	try {
		const workspaceId = Number.parseInt(req.query.id as string);
		const before = await getConfig('home', workspaceId);

		// Validate input types
		if (req.body.widgets !== undefined && !Array.isArray(req.body.widgets)) {
			return res.status(400).json({ success: false, error: 'widgets must be an array' });
		}
		if (req.body.coverImage !== undefined && req.body.coverImage !== null && typeof req.body.coverImage !== 'string') {
			return res.status(400).json({ success: false, error: 'coverImage must be a string or null' });
		}

		const after = {
			widgets: req.body.widgets ?? before?.widgets ?? [],
			coverImage: req.body.coverImage ?? before?.coverImage ?? null,
		};
		await setConfig('home', after, workspaceId);
		await logAudit(workspaceId, (req as any).session?.userid || null, 'settings.general.home.update', 'home', { before, after });
		res.status(200).json({ success: true})
	} catch (error) {
		console.error('Failed to save home settings:', error);
		return res.status(500).json({ success: false, error: 'Server error' });
	}
}
