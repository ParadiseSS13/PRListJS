import axios from 'axios';
import React, { Fragment } from 'react';
import { Button, notification, Tag } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencil } from '@fortawesome/free-solid-svg-icons';
import { VoteButton } from './vote/votebutton';
import * as VotingGroup from './VotingGroup';

export class ApiManager {
    constructor() {
        console.log("[API] Loading...");

        this.apiroot = "https://www.paradisestation.org/forum/custom/prs_api.php?t=";

        // Auth stuff
        this.authorised = false;
        this.authFailMsg = null;
        this.loaded = false;

        // User vars
        this.userName = null;
        this.uid = null;
        this.highest_group = null;
        this.rights = [];

        // PR list
        this.prs_loaded = false;
        this.pr_list = [];

        this.tmrs = [];
        this.votes = [];
        this.notes = [];

        // PR list settup
        this.prls = null;

        console.log("[API] Loaded.");
    }

    async get(querystr) {
        return await axios.get(this.apiroot + querystr, {
            validateStatus: function (status) { return true; }
        });
    }

    async post(querystr, postbody) {
        return await axios.post(this.apiroot + querystr, postbody, {
            validateStatus: function (status) { return true; }
        });
    }

    async tryLogin() {

        // Just try get the base page
        let response = await this.get("ping");

        if (response.status == 200) {
            this.authorised = true;
            this.userName = response.data.un;
            this.uid = response.data.uid;
            this.highest_group = response.data.highest_group;
            this.rights = response.data.rights;
        } else {
            this.authorised = false;
            this.authFailMsg = response.data;
        }

        this.loaded = true;
    }

    async getPrs() {
        let response = await this.get("prlist");
        this.pr_list = response.data["prs"];

        // Add TMs + Notes
        this.tmrs = response.data["tmrs"];
        this.notes = response.data["notes"];
        this.votes = response.data["votes"];

        console.log(this.votes);

        this.prs_loaded = true;
        this.prls(this.pr_list);
    }

    async setNewPrTypes(prNumber, newPrTypes) {
        const pr = this.pr_list.find(pr => pr.num === prNumber);
        if (!pr) {
            console.error("Could not find PR! " + prNumber);
            return;
        }
        this.setPrTypes(pr, newPrTypes);
    }

    /**
     * Sends the new voting groups of a PR to the API
     * @param {number} pr The PR number it is about
     * @param {string[]} prVotingGroups The PR voting groups
     */
    async setPrTypes(pr, prVotingGroups) {
        let response = await this.post("setPrGroups", {
            prn: pr.num,
            prGroups: prVotingGroups
        });
        if (response.status == 200) {
            console.log("Refreshing PRs");
            await this.getPrs();
        } else {
            notification.open({
                message: "Error - " + response.status,
                description: "Request failed. Inform AA if this aint right."
            });
        }
    }

    async removeTmr(prnum) {
        console.log("Removing TMR for " + prnum);
        let response = await this.post("deltmr", {
            prn: prnum
        });
        if (response.status == 200) {
            console.log("Refreshing PRs");
            await this.getPrs();
        } else {
            notification.open({
                message: "Error - " + response.status,
                description: "Request failed. Inform AA if this aint right."
            });
        }
    }

    async addTmr(prnum) {
        console.log("Adding TMR for " + prnum);
        let response = await this.post("addtmr", {
            prn: prnum
        });
        if (response.status == 200) {
            console.log("Refreshing PRs");
            await this.getPrs();
        } else {
            notification.open({
                message: "Error - " + response.status,
                description: "Request failed. Inform AA if this aint right."
            });
        }
    }

    async addVote(prnum, vtype, vgroup) {
        console.log("Adding vote for " + prnum + " (VT: " + vtype + " | VG: " + vgroup + ")");
        let response = await this.post("addvote", {
            prn: prnum,
            vt: vtype,
            vc: vgroup,
        });
        if (response.status == 200) {
            console.log(response);
            console.log("Refreshing PRs");
            await this.getPrs();
        } else {
            notification.open({
                message: "Error - " + response.status,
                description: "Request failed. Inform AA if this aint right."
            });
        }
    }

    async delVote(prnum, vgroup) {
        console.log("Removing vote for " + prnum + " (VG: " + vgroup + ")");
        let response = await this.post("delvote", {
            prn: prnum,
            vc: vgroup,
        });
        if (response.status == 200) {
            console.log("Refreshing PRs");
            await this.getPrs();
        } else {
            notification.open({
                message: "Error - " + response.status,
                description: "Request failed. Inform AA if this aint right."
            });
        }
    }

    showTmrs(prnum) {
        let out_tags = Array();
        let i = 0;
        let tmr_added = false;
        this.tmrs.forEach(tmr => {
            if (tmr.prn != prnum) {
                return; // Continue to next
            }
            i++;
            if (tmr.fuid === this.uid) {
                // Its ours, tag it
                out_tags.push(<Fragment key={prnum + "-" + i}><Tag color="blue" closable onClose={(e) => { e.preventDefault(); this.removeTmr(prnum); }}>{tmr.un}</Tag><br /></Fragment>);
                tmr_added = true;
            } else {
                // Its not ours, just show it
                out_tags.push(<Fragment key={prnum + "-" + i}><Tag color="blue">{tmr.un}</Tag><br /></Fragment>);
            }
        });
        if (!tmr_added) {
            out_tags.push(<Button key={prnum + "-add"} size="small" onClick={() => this.addTmr(prnum)}><FontAwesomeIcon icon={faPlus} /></Button>);
        }
        return (
            <>
                {out_tags}
            </>
        );
    }

    tag2prefix(tag, prnum) {
        switch (tag) {
            case "LEGACY": {
                return "[L]";
            }
            case "DESIGN": {
                return "[D]";
            }
            case "SPRITE": {
                return "[S]";
            }
            case "MAP": {
                return "[M]";
            }
            case "VETO": {
                const pr = this.pr_list.find(pr => pr.num === prnum);
                if (pr && pr.ptype && Array.isArray(pr.ptype) && pr.ptype.includes(VotingGroup.HEADCODER)) { // If a headcoder has voted using the "veto" group, and the PR has the "Headcoder" category, we want [V] to display as [H] on the frontend
                    return "[H]";
                } else {
                    return "[V]";
                }
            }
        }
    }

    showApprovals(prnum) {
        let out_tags = Array();
        let i = 0;
        let vote_added = false;
        this.votes.forEach(vote => {
            if (vote.prn != prnum) {
                return; // Continue to next
            }
            if (vote.vt != "APPROVE") {
                return; // Continue to next
            }
            i++;
            if (vote.fuid === this.uid) {
                // Its ours, tag it
                out_tags.push(<Fragment key={prnum + "-" + i}><Tag color="green" closable onClose={(e) => { e.preventDefault(); this.delVote(prnum, "Approval"); }}>{this.tag2prefix(vote.vg, prnum)} {vote.un}</Tag><br /></Fragment>);
                vote_added = true;
            } else {
                // Its not ours, just show it
                out_tags.push(<Fragment key={prnum + "-" + i}><Tag color="green">{this.tag2prefix(vote.vg, prnum)} {vote.un}</Tag><br /></Fragment>);
            }
        });
        if (!vote_added) {
            out_tags.push(<VoteButton key={prnum + "-approvalbutton"} votecat="Approval" prnum={prnum} />);
        }
        return (
            <>
                {out_tags}
            </>
        );
    }


    showObjections(prnum) {
        let out_tags = Array();
        let i = 0;
        let vote_added = false;
        this.votes.forEach(vote => {
            if (vote.prn != prnum) {
                return; // Continue to next
            }
            if (vote.vt != "OBJECT") {
                return; // Continue to next
            }
            i++;
            if (vote.fuid === this.uid) {
                // Its ours, tag it
                out_tags.push(<Fragment key={prnum + "-" + i}><Tag color="red" closable onClose={(e) => { e.preventDefault(); this.delVote(prnum, "Objection"); }}>{this.tag2prefix(vote.vg, prnum)} {vote.un}</Tag><br /></Fragment>);
                vote_added = true;
            } else {
                // Its not ours, just show it
                out_tags.push(<Fragment key={prnum + "-" + i}><Tag color="red">{this.tag2prefix(vote.vg, prnum)} {vote.un}</Tag><br /></Fragment>);
            }
        });
        if (!vote_added) {
            out_tags.push(<VoteButton key={prnum + "-objectionbutton"} votecat="Objection" prnum={prnum} />);
        }
        return (
            <>
                {out_tags}
            </>
        );
    }


    showNotes(prnum) {
        let out_tags = Array();
        let i = 0;
        this.notes.forEach(note => {
            if (note.prn != prnum) {
                return; // Continue to next
            }
            i++;
            out_tags.push(
                <Fragment key={prnum + "-" + i}>
                    <Tag color="pink">{note.un}</Tag>
                    <small>{note.nt}</small>
                    <br />
                </Fragment>
            );
        });
        out_tags.push(<Button key={prnum + "-edit"} size="small" onClick={() => this.editNote(prnum)}><FontAwesomeIcon icon={faPencil} /></Button>);
        return (
            <>
                {out_tags}
            </>
        );
    }

    setPrListSetter(prls) {
        this.prls = prls;
    }

    async editNote(prnum) {
        console.log("Editing note for PR " + prnum);

        let existing_text = "";

        // Check for existing text
        this.notes.forEach(note => {
            if (note.prn != prnum) {
                return; // Continue to next
            }
            if (note.fuid != this.uid) {
                return; // Continue to next
            }
            existing_text = note.nt;
        });

        let new_text = null;

        let text_input = prompt("Enter comment. Leave blank for nothing", existing_text);
        if (text_input == null) {
            console.log("Edit cancelled");
            return;
        }

        if (text_input.length == 0) {
            console.log("Removing comment");
            new_text = "";
        } else {
            console.log("Comment text for #" + prnum + ":" + new_text);
            new_text = text_input;
        }

        this.editNoteRequest(prnum, new_text);
    }

    async editNoteRequest(prnum, newText) {
        let response = await this.post("setcomment", {
            prn: prnum,
            cmt: newText
        });
        if (response.status == 200) {
            console.log("Refreshing PRs");
            await this.getPrs();
        } else {
            notification.open({
                message: "Error - " + response.status,
                description: "Request failed. Inform AA if this aint right."
            });
        }
    }
}