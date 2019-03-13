<?php
header('Access-Control-Allow-Origin: *'); 
$conn = mysqli_connect("localhost", "root", "", "expense_tracker");
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}


if(isset($_GET['action']) && $_GET['action'] == 'auth')
{
	$_POST = (array)json_decode(file_get_contents("php://input"));

	$sql = "SELECT * from users where mobile = ".$_POST['mobile']." and password = '".$_POST['password']."'";
	$result = mysqli_query($conn, $sql);

	if(mysqli_num_rows($result))
	{
		echo json_encode(mysqli_fetch_assoc($result));
		exit;
	}
	echo 'error';
	exit;
}
elseif(isset($_GET['action']) && $_GET['action'] == 'users')
{
	$sql = "select * from users";
	$result = mysqli_query($conn, $sql);

	$res = [];

	while($r = mysqli_fetch_assoc($result))
	{
		$res[] = $r;
	}

	echo json_encode($res);
	exit;
}
elseif(isset($_GET['action']) && $_GET['action'] == 'expenses')
{
	$sql = "select * from expenses";
	$result = mysqli_query($conn, $sql);

	$res = [];

	while($r = mysqli_fetch_assoc($result))
	{
		$res[] = $r;
	}

	echo json_encode($res);
	exit;
}
elseif(isset($_GET['action']) && $_GET['action'] == 'overview')
{
	$cm = strtotime("now");

	$sql = "select count(*) as user from users";
	$result = mysqli_query($conn, $sql);
	$us = mysqli_fetch_assoc($result);
	$users = $us['user'];

	$sql = "select count(amount) as cnt, sum(amount) as amt from expenses where month(edate) = ".date("m", $cm)." and year(edate) = ".date("Y", $cm);
	$result = mysqli_query($conn, $sql);
	$r1 = mysqli_fetch_assoc($result);
	$r1['amt'] = $r1['cnt'] ? $r1['amt'] : 0;

	$sql = "select count(amount) as cnt, sum(amount) as amt from expenses where paid_by = ".$_GET['id']." and month(edate) = ".date("m", $cm)." and year(edate) = ".date("Y", $cm);
	$result = mysqli_query($conn, $sql);
	$r2 = mysqli_fetch_assoc($result);
	$r2['amt'] = $r2['cnt'] ? $r2['amt'] : 0;

	$lm = strtotime("last month");

	$sql = "select count(amount) as cnt, sum(amount) as amt from expenses where month(edate) = ".date("m", $lm)." and year(edate) = ".date("Y", $lm);
	$result = mysqli_query($conn, $sql);
	$r3 = mysqli_fetch_assoc($result);
	$r3['amt'] = $r3['cnt'] ? $r3['amt'] : 0;

	$sql = "select count(amount) as cnt, sum(amount) as amt from expenses where paid_by = ".$_GET['id']." and month(edate) = ".date("m", $lm)." and year(edate) = ".date("Y", $lm);
	$result = mysqli_query($conn, $sql);
	$r4 = mysqli_fetch_assoc($result);
	$r4['amt'] = $r4['cnt'] ? $r4['amt'] : 0;

	echo json_encode([
		'cmonth' => ['texpense' => $r1['amt'], 'spent' => $r2['amt'], 'ph' => $r1['amt']/$users, 'balance' => $r1['amt']/$users - $r2['amt']], 
		'lmonth' => ['texpense' => $r3['amt'], 'spent' => $r4['amt'], 'ph' => $r3['amt']/$users, 'balance' => $r3['amt']/$users - $r4['amt']]
		]);
	exit;
}
elseif(isset($_GET['action']) && $_GET['action'] == 'add_expense')
{
	$_POST = (array)json_decode(file_get_contents("php://input"));

	$user_id = $_POST['user_id'];
	$expense = $_POST['expense'];
	$type = $_POST['type'];
	$particulars = $_POST['particulars'];
	$amount = $_POST['amount']; 
	$paid_by = $_POST['paid_by'];
	$edate = $_POST['edate'];

	$sql = "INSERT INTO expenses (user_id, expense, type, particulars, amount, paid_by, edate)
			VALUES ($user_id, '$expense', '$type', '$particulars', $amount, $paid_by, '$edate')";
	$result = mysqli_query($conn, $sql);
	echo mysqli_insert_id($conn);
	exit;
}