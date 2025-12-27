import axios from "axios";
import React from "react";
import type toast from "react-hot-toast";
import { useRecoilState } from "recoil";
import SwitchComponenet from "@/components/switch";
import { workspacestate } from "@/state";
import { FC } from '@/types/settingsComponent'
import { IconArrowsUpDown } from "@tabler/icons-react";

type props = {
	triggerToast: typeof toast;
}

const Promotions: FC<props> = (props) => {
	const triggerToast = props.triggerToast;
	const [workspace, setWorkspace] = useRecoilState(workspacestate);

	const updatePromotions = async () => {
		const res = await axios.patch(`/api/workspace/${workspace.groupId}/settings/general/promotions`, { 
			enabled: !workspace.settings.promotionsEnabled
		});
		if (res.status === 200) {
			const obj = JSON.parse(JSON.stringify(workspace), (key, value) => (typeof value === 'bigint' ? value.toString() : value));
			obj.settings.promotionsEnabled = !workspace.settings.promotionsEnabled;
			setWorkspace(obj);
			triggerToast.success("Updated promotions!");
		} else {
			triggerToast.error("Failed to update promotions.");
		}
	};	

	return (
		<div>
			<div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-orange-500/10 rounded-lg">
						<IconArrowsUpDown size={20} className="text-orange-500" />
					</div>
					<div>
						<p className="text-sm font-medium text-zinc-900 dark:text-white">Promotions</p>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">Vote and recommend staff for promotions</p>
					</div>
				</div>
				<SwitchComponenet 
					checked={workspace.settings?.promotionsEnabled} 
					onChange={updatePromotions} 
					label="" 
					classoverride="mt-0"
				/>
			</div>
		</div>
	);
};

Promotions.title = "Promotions";

export default Promotions;
