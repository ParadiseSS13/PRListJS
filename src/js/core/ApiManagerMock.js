import { ApiManager } from './ApiManager';
import * as VotingGroup from './VotingGroup';

export class ApiManagerMock extends ApiManager {
    constructor() {
        super();
        console.log("Using mock API");
    }

    async refreshPage() {
        // The refresh is hooked into the given prls function
        this.prls(Array.from(this.pr_list));
    }

    async get(querystr) {
        console.error("Get should not be called in the mock!");
    }

    async post(querystr, postbody) {
        console.error("Post should not be called in the mock!");
    }

    async tryLogin() {
        this.authorised = true;
        this.userName = "MockUser";
        this.uid = "1234";
        this.highest_group = "MockGroup";
        this.rights = ["Design", "Balance", "Sprite", "Map", "Special"];
        this.loaded = true;
    }

    async getPrs() {
        this.pr_list = [
            this.makePr(12345, "Test", [VotingGroup.BALANCE], "2024-01-01", 1),
            this.makePr(12346, "Test2", [VotingGroup.DESIGN, VotingGroup.BALANCE], "2024-01-02", 2),
            this.makePr(12347, "Test3", [VotingGroup.TECHNICAL], "2024-01-03", 3),
            this.makePr(12348, "Test4", [VotingGroup.HEADCODER], "2024-01-05", 5),
            this.makePr(12349, "Test5", [VotingGroup.SPRITE], "2024-01-06", 30),
            this.makePr(12350, "Test8", [VotingGroup.MAP], "2024-01-06", 7),
        ];

        // Add TMs + Notes
        this.tmrs = [];
        this.notes = [];
        this.votes = [];

        this.prs_loaded = true;
        this.prls(this.pr_list);
    }

    makePr(num, name, type, dateOpened, daysLeft) {
        return {
            key: num,
            num: num,
            name: name,
            ptype: type,
            do: dateOpened,
            dl: daysLeft
        }

    }

    async setPrTypes(pr, prVotingGroups) {
        pr.ptype = prVotingGroups;
        console.log("Set new pr groups for pr: " + prVotingGroups);
        this.refreshPage();
    }

    async removeTmr(prnum) {
        const tmRequestIndex = this.tmrs.findIndex(tm => tm.prn == prnum);
        if (tmRequestIndex == -1) {
            console.error("Did not find tmRequest to remove!");
            return;
        }
        console.log("Found TM to remove.");
        this.tmrs.splice(tmRequestIndex, 1);
        this.refreshPage();
    }

    async addTmr(prnum) {
        this.tmrs.push({
            prn: prnum,
            fuid: this.uid,
            un: this.userName
        });
        console.log("Added TMR");
        this.refreshPage();
    }

    async addVote(prnum, vtype, vgroup) {
        console.log("Adding vote for " + prnum + " (VT: " + vtype + " | VG: " + vgroup + ")");
        this.votes.push({
            prn: prnum,
            fuid: this.uid,
            un: this.userName,
            vg: vtype.toUpperCase(),
            vt: vgroup === "Approval" ? "APPROVE" : "OBJECT"
        });
        this.refreshPage();
    }

    async delVote(prnum, vgroup) {
        console.log("Removing vote for " + prnum + " (VG: " + vgroup + ")");
        const vg = vgroup === "Approval" ? "APPROVE" : "OBJECT";
        const voteIndex = this.votes.findIndex(vote => vote.prn === prnum && vote.fuid == this.uid && vote.vt === vg);
        if (voteIndex === -1) {
            console.error("Did not find vote to remove!");
            return;
        }
        this.votes.splice(voteIndex, 1);
        console.log("Vote removed");
        this.refreshPage();
    }

    async editNoteRequest(prnum, newText) {
        const note = this.notes.find(note => note.prn === prnum && note.fuid === this.uid);
        if (!note) {
            console.log("Adding new note.");
            this.notes.push({prn: prnum, fuid: this.uid, un: this.userName, nt: newText});
            this.refreshPage();
            return;
        }
        console.log("Editting existing note");
        note.nt = newText;
        this.refreshPage();
    }
}
