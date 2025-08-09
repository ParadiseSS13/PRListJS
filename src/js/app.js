import React, { useEffect, useState } from 'react';
import { Row, Col, Spin, Table, Button, PageHeader, Modal, Tag } from 'antd';
import { API } from './core/api';
import { PrTag } from './core/pr_tag';
import * as VotingGroup from './core/VotingGroup';

export const App = () => {
    const [manualRefresh, setManualRefresh] = useState([1]);
    const [userInfoShown, setUserInfoShown] = useState(false);
    const [prList, setPrList] = useState([]);

    API.setPrListSetter(setPrList);

    const checkLogin = async () => {
        await API.tryLogin();
        setManualRefresh([2]);
    }

    const loadPrs = async () => {
        await API.getPrs();
        if(API.prs_loaded) {
            setManualRefresh([3]);
        }
    }


    // Get our data
    useEffect(() => {
        if (!API.loaded && manualRefresh < 2) {
            checkLogin();
        }
        if(API.authorised && manualRefresh < 3) {
            if (!API.prs_loaded) {
                loadPrs();
            }
        }
    }, manualRefresh);

    const showUserInfo = () => {
        setUserInfoShown(true);
    };

    const hideUserInfo = () => {
        setUserInfoShown(false);
    };

    let htitle = "Paradise PR List"
    let rights_modal = (<></>);
    if (API.authorised) {
        rights_modal = (
            <Modal title="User Info" visible={userInfoShown} onCancel={hideUserInfo} footer="">
                <ul>
                    <li>Username: {API.userName}</li>
                    <li>Forum user ID: {API.uid}</li>
                    <li>Access group: {API.highest_group}</li>
                    <li>Rights: {API.rights.join(", ")}</li>
                </ul>
            </Modal>
        );

        htitle = (
            <>
                {"Paradise PR List - Logged in as " + API.userName}
                <Button type="link" onClick={showUserInfo}>Info</Button>
            </>
        )
    }

    const pageheader = (
        <PageHeader
            title={htitle}
        />
    );

    if (!API.loaded) {
        return (
            <>
                {pageheader}
                <Row>
                    <Col span={3} />
                    <Col span={16} style={{ "textAlign": "center" }}>
                        <Spin size="large" tip={"Loading..."} />
                    </Col>
                    <Col span={3} />
                </Row>
            </>
        );
    }

    if (!API.authorised) {
        return (
            <>
                {pageheader}
                <Row>
                    <Col span={3} />
                    <Col span={16} style={{ "textAlign": "center" }}>
                        <h1>Error</h1>
                        <hr />
                        <p>{API.authFailMsg}</p>
                    </Col>
                    <Col span={3} />
                </Row>
            </>
        );
    }

    if(!API.prs_loaded) {
        return (
            <>
                {pageheader}
                {rights_modal}
                <Row>
                    <Col span={3} />
                    <Col span={16} style={{ "textAlign": "center" }}>
                        <Spin size="large" tip={"Loading PR List..."} />
                    </Col>
                    <Col span={3} />
                </Row>
            </>
        );
    }

    const formatDaysLeft = (dl) => {
        const dli = parseInt(dl);

        let tag_colour = "green";

        if(dli < 0) {
            tag_colour = "default";
        } else if(dli < 3) {
            tag_colour = "error";
        } else if(dli < 14) {
            tag_colour = "warning";
        }

        return (
            <Tag color={tag_colour}>{dl}</Tag>
        )
    }

    let cols = [
        { title: "PR #", dataIndex: "num", key: "num", width: "50px", render: text => (
            <a target="_blank" href={"https://github.com/ParadiseSS13/Paradise/pull/" + text}>#{text}</a>
        ) },
        { title: "PR Name", dataIndex: "name", key: "name", width: "20%" },
        // 13 rem in width allows for 3 types selected without jumping to a new line. This is the max we expect
        { title: "Type", dataIndex: "ptype", key: "ptype", width: "13rem", render: (types, row) => (
            <PrTag prtype={types} prnum={row.num} />
         ), filters: [
            {
                text: VotingGroup.DESIGN,
                value: VotingGroup.DESIGN
            },
            {
                text: VotingGroup.SPRITE,
                value: VotingGroup.SPRITE
            },
            {
                text: VotingGroup.TECHNICAL,
                value: VotingGroup.TECHNICAL
            },
            {
                text: VotingGroup.HEADCODER,
                value: VotingGroup.HEADCODER
            },
            {
                text: VotingGroup.MAP,
                value: VotingGroup.MAP
            },
            {
                text: VotingGroup.UNSET,
                value: VotingGroup.UNSET
            }
         ],
         onFilter: (value, pr) => {
            if (value === VotingGroup.UNSET) {
                return pr.ptype.length === 0;
            }
            return pr.ptype.includes(value);
         }
        },
        { title: "Date Opened", dataIndex: "do", key: "do", width: "6%" },
        { title: "Days Left", dataIndex: "dl", key: "dl", width: "4%", render: text => (
            formatDaysLeft(text)
        ) },
        { title: "Approvals", dataIndex: "approvals", key: "approvals", width: "7%", render: (text, row) => (
            API.showApprovals(row.num)
        ) },
        { title: "Objections", dataIndex: "objections", key: "objections", width: "7%", render: (text, row) => (
            API.showObjections(row.num)
        ) },
        { title: "Comments", dataIndex: "comments", key: "comments", width: "auto", render: (text, row) => (
            API.showNotes(row.num)
        ) },
        { title: "TM Requests", dataIndex: "tmrs", key: "tmrs", width: "7%", render: (text, row) => (
            API.showTmrs(row.num)
        ) },
      ];

    return (
        <>
            {pageheader}
            {rights_modal}
            <Table columns={cols} dataSource={prList} pagination={false} />
        </>
    );

};
