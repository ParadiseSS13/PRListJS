<?php

// Uncomment to enable CORS testing
// header("Access-Control-Allow-Origin: *");

// Import IPB
require_once '../init.php';

\IPS\Session\Front::i();
$member = \IPS\Member::loggedIn();
if (!($member->real_name)) {
    // Make us an error

    print "Please login on the forums, then refresh this page";
    http_response_code(401);
    exit();
}

// Groups which are allowed to access
$gids = array(
    // Staff groups
    "TA" => 20,
    "GA" => 11,
    "CM" => 29,
    "SDEV" => 34,
    "HOST" => 4,
    "HEAD" => 23,
    // Voting groups
    "HEADCODER" => 19,
    "DESIGNTEAM" => 41,
    "SPRITETEAM" => 42,
    "REVIEWTEAM" => 14,
    "MAPTEAM" => 45
);

if (!($member->inGroup($gids))) {
    print "Access Denied";
    http_response_code(401);
    exit();
}

// Groups that can view but have no rights
$t0_groups = array($gids["TA"], $gids["GA"], $gids["CM"], $gids["SDEV"], $gids["HOST"], $gids["HEAD"]);

// Groups that have ability to vote + request TMs + other stuff
$t1_groups = array($gids["HEADCODER"], $gids["DESIGNTEAM"], $gids["REVIEWTEAM"], $gids["SPRITETEAM"], $gids["MAPTEAM"]);

// Gets user access level
function getAccessLevel()
{
    global $gids, $member, $t1_groups;
    if ($member->inGroup($gids["HEADCODER"])) {
        return "Headcoder";
    }

    if ($member->inGroup($t1_groups)) {
        return "Voting Access";
    }

    return "Read Only";
}

function getPrDB()
{
    return new mysqli("your_host", "your_user", "your_pass", "your_db");
}

function ensureOpen($dbc, $pr_num)
{
    $stmt = $dbc->prepare("SELECT id FROM prs WHERE pr_number=? AND pr_status=\"OPEN\"");
    $stmt->bind_param("i", $pr_num);
    $stmt->execute();
    $result = $stmt->get_result();
    $pr_found = false;
    while ($row = $result->fetch_assoc()) {
        $pr_found = true;
    }

    return $pr_found;
}


// Gets the rights of a member
function getAllRights()
{
    global $gids, $member;

    $out_array = array();
    // This trumps everything else
    if ($member->inGroup($gids["HEADCODER"]) || $member->member_id == 3288) { // Grant AA AA
        array_push($out_array, "Special");
        array_push($out_array, "Design");
        array_push($out_array, "Sprite");
        array_push($out_array, "Comment");
        array_push($out_array, "Map");
        array_push($out_array, "TMR");
        return $out_array;
    }

    // These 2 get their respective votes
    if ($member->inGroup($gids["DESIGNTEAM"])) {
        array_push($out_array, "Design");
        array_push($out_array, "Comment");
        array_push($out_array, "TMR");
    }

    if ($member->inGroup($gids["SPRITETEAM"])) {
        array_push($out_array, "Sprite");
        array_push($out_array, "Comment");
        array_push($out_array, "TMR");
    }

    if ($member->inGroup($gids["MAPTEAM"])) {
        array_push($out_array, "Map");
        array_push($out_array, "Comment");
        array_push($out_array, "TMR");
    }

    // Reviewers can flag TMRs and comments down
    if ($member->inGroup($gids["REVIEWTEAM"]) || $member->inGroup($gids["HOST"])) {
        array_push($out_array, "Comment");
        array_push($out_array, "TMR");
    }


    $out_array2 = array_unique($out_array);

    return $out_array2;
}

$fuid = $member->member_id;

function cacheMember()
{
    global $fuid, $member;
    $conn = getPrDB();
    $stmt = $conn->prepare("SELECT username FROM member_cache WHERE fuid=?");
    $stmt->bind_param("i", $fuid);
    $stmt->execute();
    $result = $stmt->get_result();
    $exists = false;
    while ($row = $result->fetch_assoc()) {
        $exists = true;
        break;
    }
    if ($exists) {
        // We exist, just update us
        $stmt = $conn->prepare("UPDATE member_cache SET username=?, last_seen=NOW() WHERE fuid=?");
        $stmt->bind_param("si", $member->real_name, $fuid);
        $stmt->execute();
        return;
    }
    $stmt = $conn->prepare("INSERT INTO member_cache (fuid, username, last_seen) VALUES (?, ?, NOW())");
    $stmt->bind_param("is", $fuid, $member->real_name);
    $stmt->execute();
}


switch ($_GET["t"]) {
    case "ping": {
            cacheMember();
            $json_data = array();
            $json_data["un"] = $member->real_name;
            $json_data["uid"] = $fuid;
            $json_data["highest_group"] = getAccessLevel();
            $json_data["rights"] = getAllRights();
            header('Content-Type: application/json');
            echo json_encode($json_data);
            exit();
        }

    case "prlist": {
            // Lets get all the PRs for now, votes can come later
            $prs = array();
            $conn = getPrDB();
            $stmt = $conn->prepare("SELECT *, (15 - DATEDIFF(NOW(), date_opened)) AS days_left, DATE_FORMAT(date_opened, \"%Y-%m-%d\") AS df FROM prs WHERE pr_status='OPEN' ORDER BY pr_number ASC");
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $this_pr = array();
                $this_pr["key"] = $row["pr_number"]; // Key for react memes
                $this_pr["num"] = $row["pr_number"];
                $this_pr["name"] = $row["pr_name"];
                $this_pr["ptype"] = json_decode($row["pr_types"]);
                $this_pr["dl"] = $row["days_left"];
                $this_pr["do"] = $row["df"];

                array_push($prs, $this_pr);
            }

            $out_data = array();
            $out_data["prs"] = $prs;

            // Get TMRs
            $stmt2 = $conn->prepare("SELECT tm_requests.pr_number AS prn, tm_requests.requesting_member_fuid AS fuid, member_cache.username AS un FROM tm_requests LEFT JOIN member_cache ON member_cache.fuid = tm_requests.requesting_member_fuid WHERE pr_number IN (SELECT pr_number FROM prs WHERE pr_status=\"OPEN\")");
            $stmt2->execute();
            $result2 = $stmt2->get_result();
            $result2_arr = array();
            while ($row2 = $result2->fetch_assoc()) {
                array_push($result2_arr, $row2);
            }

            $out_data["tmrs"] = $result2_arr;

            // Get comments
            $stmt3 = $conn->prepare("SELECT notes.pr_number AS prn, notes.noting_member_fuid AS fuid, member_cache.username AS un, note_text AS nt FROM notes LEFT JOIN member_cache ON member_cache.fuid = notes.noting_member_fuid WHERE pr_number IN (SELECT pr_number FROM prs WHERE pr_status=\"OPEN\")");
            $stmt3->execute();
            $result3 = $stmt3->get_result();
            $result3_arr = array();
            while ($row3 = $result3->fetch_assoc()) {
                array_push($result3_arr, $row3);
            }

            $out_data["notes"] = $result3_arr;

            // Get all votes
            $stmt4 = $conn->prepare("SELECT votes_new.pr_number AS prn, votes_new.voting_member_fuid AS fuid, member_cache.username AS un, votes_new.voting_group AS vg, votes_new.vote_type AS vt FROM votes_new LEFT JOIN member_cache ON member_cache.fuid = votes_new.voting_member_fuid WHERE pr_number IN (SELECT pr_number FROM prs WHERE pr_status=\"OPEN\")");
            $stmt4->execute();
            $result4 = $stmt4->get_result();
            $result4_arr = array();
            while ($row4 = $result4->fetch_assoc()) {
                array_push($result4_arr, $row4);
            }

            $out_data["votes"] = $result4_arr;

            header('Content-Type: application/json');
            echo json_encode($out_data);
            exit();
        }

    case "settype": {
            $rightsarr = getAllRights();
            if (!in_array("Special", $rightsarr)) {
                print "Access Denied";
                http_response_code(403);
                exit();
            }
            // If we got here we have the rights for it
            $conn = getPrDB();

            // Right, decode the body
            $postbod = file_get_contents('php://input');
            $postdata = json_decode($postbod, true);

            // Make sure its open
            if (!ensureOpen($conn, $postdata["prn"])) {
                print "Attempted to modify a closed PR";
                http_response_code(403);
                exit();
            }

            // Do DB shenanigans
            $stmt = $conn->prepare("UPDATE prs SET pr_type=? WHERE pr_number=?");
            $stmt->bind_param("si", $postdata["prt"], $postdata["prn"]);
            $stmt->execute();

            // Exit
            exit();
        }

    case "setPrGroups": {
            $rightsarr = getAllRights();
            if (!in_array("Special", $rightsarr)) {
                print "Access Denied";
                http_response_code(403);
                exit();
            }
            // If we got here we have the rights for it
            $conn = getPrDB();

            // Right, decode the body
            $postbod = file_get_contents('php://input');
            $postdata = json_decode($postbod, true);

            // Make sure its open
            if (!ensureOpen($conn, $postdata["prn"])) {
                print "Attempted to modify a closed PR";
                http_response_code(403);
                exit();
            }

            // Do DB shenanigans
            $pr_groups = json_encode($postdata["prGroups"]);
            $stmt = $conn->prepare("UPDATE prs SET pr_types=? WHERE pr_number=?");
            $stmt->bind_param("si", $pr_groups, $postdata["prn"]);
            $stmt->execute();

            // Exit
            exit();
        }

    case "addtmr": {
            $rightsarr = getAllRights();
            if (!in_array("TMR", $rightsarr)) {
                print "Access Denied";
                http_response_code(403);
                exit();
            }
            // If we got here we have the rights for it

            $postbod = file_get_contents('php://input');
            $postdata = json_decode($postbod, true);
            // Right, decode the body
            $pr_num = $postdata["prn"];

            if (is_null($pr_num)) {
                return;
            }

            $conn = getPrDB();

            // Make sure its open
            if (!ensureOpen($conn, $pr_num)) {
                print "Attempted to modify a closed PR";
                http_response_code(403);
                exit();
            }

            $stmt = $conn->prepare("SELECT id FROM tm_requests WHERE requesting_member_fuid=? AND pr_number=?");
            $stmt->bind_param("ii", $fuid, $pr_num);
            $stmt->execute();
            $result = $stmt->get_result();
            $exists = false;
            while ($row = $result->fetch_assoc()) {
                $exists = true;
                break;
            }
            if ($exists) {
                return;
            }
            $stmt = $conn->prepare("INSERT INTO tm_requests (requesting_member_fuid, pr_number) VALUES (?, ?)");
            $stmt->bind_param("ii", $fuid, $pr_num);
            $stmt->execute();

            exit(); // We done
        }

    case "deltmr": {
            $rightsarr = getAllRights();
            if (!in_array("TMR", $rightsarr)) {
                print "Access Denied";
                http_response_code(403);
                exit();
            }
            // If we got here we have the rights for it

            $postbod = file_get_contents('php://input');
            $postdata = json_decode($postbod, true);
            // Right, decode the body
            $pr_num = $postdata["prn"];

            if (is_null($pr_num)) {
                return;
            }

            $conn = getPrDB();

            // Make sure its open
            if (!ensureOpen($conn, $pr_num)) {
                print "Attempted to modify a closed PR";
                http_response_code(403);
                exit();
            }

            $stmt = $conn->prepare("DELETE FROM tm_requests WHERE requesting_member_fuid=? AND pr_number=?");
            $stmt->bind_param("ii", $fuid, $pr_num);
            $stmt->execute();

            exit(); // We done
        }

    case "setcomment": {
            $rightsarr = getAllRights();
            if (!in_array("Comment", $rightsarr)) {
                print "Access Denied";
                http_response_code(403);
                exit();
            }
            // If we got here we have the rights for it

            $postbod = file_get_contents('php://input');
            $postdata = json_decode($postbod, true);
            // Right, decode the body
            $pr_num = $postdata["prn"];
            $comment = $postdata["cmt"];
            // No comment, remove it
            $conn = getPrDB();

            // Make sure its open
            if (!ensureOpen($conn, $pr_num)) {
                print "Attempted to modify a closed PR";
                http_response_code(403);
                exit();
            }

            if (strlen($comment) == 0) {
                $stmt = $conn->prepare("DELETE FROM notes WHERE noting_member_fuid=? AND pr_number=?");
                $stmt->bind_param("ii", $fuid, $pr_num);
                $stmt->execute();
            } else {
                // Insert or update it

                // FIrst see if we exist at all
                $stmt = $conn->prepare("SELECT note_text FROM notes WHERE noting_member_fuid=? AND pr_number=?");
                $stmt->bind_param("ii", $fuid, $pr_num);
                $stmt->execute();
                $result = $stmt->get_result();
                $exists = false;
                while ($row = $result->fetch_assoc()) {
                    $exists = true;
                    break;
                }
                if ($exists) {
                    // We exist, update
                    $stmt = $conn->prepare("UPDATE notes SET note_text=? WHERE noting_member_fuid=? AND pr_number=?");
                    $stmt->bind_param("sii", $comment, $fuid, $pr_num);
                    $stmt->execute();
                    return;
                }
                // We dont exist, insert
                $stmt = $conn->prepare("INSERT INTO notes (noting_member_fuid, pr_number, note_text) VALUES (?, ?, ?)");
                $stmt->bind_param("iis", $fuid, $pr_num, $comment);
                $stmt->execute();
            }

            exit(); // We done
        }

    case "addvote": {
            $rightsarr = getAllRights();
            if (!(in_array("Design", $rightsarr) || in_array("Sprite", $rightsarr) || in_array("Special", $rightsarr) || in_array("Map", $rightsarr))) {
                print "Access Denied";
                http_response_code(403);
                exit();
            }
            // If we got here we have the rights for it. Now lets check in detail

            $postbod = file_get_contents('php://input');
            $postdata = json_decode($postbod, true);
            // Right, decode the body
            $pr_num = $postdata["prn"];
            $votetype = null;
            switch ($postdata["vt"]) {
                case "Design": {
                        if (in_array("Design", $rightsarr)) {
                            $votetype = "DESIGN";
                        }
                        break;
                    }
                case "Sprite": {
                        if (in_array("Sprite", $rightsarr)) {
                            $votetype = "SPRITE";
                        }
                        break;
                    }
                case "Veto": {
                        if (in_array("Special", $rightsarr)) {
                            $votetype = "VETO";
                        }
                        break;
                    }
                case "Map": {
                        if (in_array("Map", $rightsarr)) {
                            $votetype = "MAP";
                        }
                        break;
                }
            }

            $votecat = null;

            switch ($postdata["vc"]) {
                case "Approval": {
                        $votecat = "APPROVE";
                        break;
                    }
                case "Objection": {
                        $votecat = "OBJECT";
                        break;
                    }
            }

            if (is_null($pr_num) || is_null($votetype) || is_null($votecat)) {
                return;
            }

            $conn = getPrDB();

            if (!ensureOpen($conn, $pr_num)) {
                print "Attempted to modify a closed PR";
                http_response_code(403);
                exit();
            }

            $stmt = $conn->prepare("SELECT id FROM votes_new WHERE voting_member_fuid=? AND pr_number=? AND vote_type=?");
            $stmt->bind_param("iis", $fuid, $pr_num, $vote_type);
            $stmt->execute();
            $result = $stmt->get_result();
            $exists = false;
            while ($row = $result->fetch_assoc()) {
                $exists = true;
                break;
            }
            if ($exists) {
                return;
            }

            $stmt = $conn->prepare("INSERT INTO votes_new (voting_member_fuid, pr_number, voting_group, vote_type) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("iiss", $fuid, $pr_num, $votetype, $votecat);
            $stmt->execute();


            exit(); // We done
        }


    case "delvote": {
            $rightsarr = getAllRights();
            if (!(in_array("Design", $rightsarr) || in_array("Sprite", $rightsarr) ||  in_array("Special", $rightsarr))) {
                print "Access Denied";
                http_response_code(403);
                exit();
            }
            // If we got here we have the rights for it

            $postbod = file_get_contents('php://input');
            $postdata = json_decode($postbod, true);
            // Right, decode the body
            $pr_num = $postdata["prn"];
            $votetype = null;
            $votecat = null;

            switch ($postdata["vc"]) {
                case "Approval": {
                        $votecat = "APPROVE";
                        break;
                    }
                case "Objection": {
                        $votecat = "OBJECT";
                        break;
                    }
            }

            if (is_null($pr_num) || is_null($votecat)) {
                return;
            }

            $conn = getPrDB();

            if (!ensureOpen($conn, $pr_num)) {
                print "Attempted to modify a closed PR";
                http_response_code(403);
                exit();
            }

            $stmt = $conn->prepare("DELETE FROM votes_new WHERE voting_member_fuid=? AND pr_number=? AND vote_type=?");
            $stmt->bind_param("iis", $fuid, $pr_num, $votecat);
            $stmt->execute();

            exit(); // We done
        }
}

print "Bad request";
http_response_code(401);
exit();
