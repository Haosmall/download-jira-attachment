require("dotenv").config({ path: __dirname + "/.env" });
const service = require("./services");
const filePath = process.env.FILE_PATH || `${__dirname}/jira-attachments`;

const app = async () => {
	const listIssueId = await service.getListIssueByProject();
	const listAttachmentId = await service.getListAttachmentByListIssueId(
		listIssueId
	);
	const listAttachment = await service.getListAttachment(listAttachmentId);
	await service.downloadAttachment(listAttachment, filePath);
};
app();
