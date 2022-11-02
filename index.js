require("dotenv").config({ path: __dirname + "/.env" });
const service = require("./services");
const filePath = process.env.FILE_PATH || `${__dirname}/jira-attachments`;

const app = async () => {
	try {
		const listIssueId = await service.getListIssueByProject();
		const listAttachmentId = await service.getListAttachmentByListIssueId(
			listIssueId
		);

		if (listAttachmentId.length === 0) {
			console.log("Attachment not found");
			return;
		}
		// else {
		// 	console.log(`Found ${listAttachmentId.length} attachments`);
		// }
		const listAttachment = await service.getListAttachment(listAttachmentId);
		await service.downloadAttachment(listAttachment, filePath);
	} catch (error) {
		console.error(error);
	}
};
app();
