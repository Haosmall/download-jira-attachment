const fetch = require("node-fetch");
const fs = require("fs");
const request = require("request");

const DOMAIN = process.env.DOMAIN || "";
const EMAIL = process.env.EMAIL || "";
const API_TOKEN = process.env.API_TOKEN;
const PROJECT_KEY = process.env.PROJECT_KEY;

const TOKEN = `Basic ${Buffer.from(`${EMAIL}:${API_TOKEN}`).toString(
	"base64"
)}`;
const BASE_URL = `https://${DOMAIN}.atlassian.net/rest/api/3`;

const headers = {
	Authorization: TOKEN,
	Accept: "application/json",
	"Content-Type": "application/json",
};

class Service {
	async getListIssueByProject() {
		const url = `${BASE_URL}/search?jql=project=${PROJECT_KEY}`;
		try {
			const response = await fetch(url, {
				method: "GET",
				headers,
			});
			const json = await response.json();
			const listIssueId = json?.issues?.map((ele) => ele.id) || [];
			console.log("Step (1/4): Get issue list");

			return listIssueId;
		} catch (error) {
			console.error(error);
		}
	}

	async getListAttachmentIdByIssueId(issueId) {
		const url = `${BASE_URL}/issue/${issueId}`;
		try {
			const response = await fetch(url, {
				method: "GET",
				headers,
			});
			const json = await response.json();
			const listAttachmentId =
				json?.fields?.attachment?.map((ele) => ele.id) || [];

			return listAttachmentId;
		} catch (error) {
			console.error(error);
		}
	}

	async getListAttachmentByListIssueId(listIssueId) {
		let listAttachmentId = [];
		for (const issueId of listIssueId) {
			const temp = await this.getListAttachmentIdByIssueId(issueId);
			listAttachmentId = [...listAttachmentId, ...temp];
		}
		console.log("Step (2/4): Get attachment id list");
		return listAttachmentId;
	}

	async getAttachmentInfo(attachmentId) {
		const url = `${BASE_URL}/attachment/${attachmentId}`;
		try {
			const response = await fetch(url, {
				method: "GET",
				headers,
			});
			const json = await response.json();
			return json;
		} catch (error) {
			console.error(error);
		}
	}

	async getListAttachment(listAttachmentId) {
		const listAttachment = [];
		for (const attachmentId of listAttachmentId) {
			const temp = await this.getAttachmentInfo(attachmentId);
			listAttachment.push(temp);
		}
		console.log("Step (3/4): Get attachment list");
		return listAttachment;
	}

	async downloadAttachment(listAttachment, path) {
		console.log("Step (4/4): Download attachment");
		let i = 0;
		const total = listAttachment.length;

		// create directory
		const directory = `${path}/${PROJECT_KEY}-${Date.now()}`;
		fs.mkdir(directory, { recursive: true }, (err) => {
			if (err) throw err;
		});

		for (const attachment of listAttachment) {
			try {
				request({ method: "GET", url: attachment.content, headers }).pipe(
					fs.createWriteStream(`${directory}/${attachment.filename}`)
				);
				i++;
				process.stdout.write(`\rDownloading (${i}/${total})`);
			} catch (error) {
				console.error(error);
			}
		}
		console.log(`\r%cDownload Completed! (${i}/${total})`, "color: #bada55");
	}
}

module.exports = new Service();
