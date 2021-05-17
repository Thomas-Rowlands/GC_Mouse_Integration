
<?php
ini_set('display_errors', '0');
include 'database.php';

if (isset($_GET["entry"]) && isset($_GET["ontology"])) {
    $cmd = "";
    $ont = strtolower($_GET["ontology"]);
    $entry = strtolower($_GET["entry"]);
    $cmd = "MATCH (n)
    WHERE n.ontology = {ont} AND toLower(n.FSN) STARTS WITH {entry} AND n.isObsolete = \"false\" 
    RETURN n.FSN AS FSN, n.originalType AS type, n.ontology AS ontology
    ORDER BY FSN
    LIMIT 5;";
    $neo = new Neo_Connection();
    $result = $neo->execute($cmd, ['entry' => $entry, 'ont' => $ont]);
    $matches = [];
    foreach ($result as $row) {
        $type = $row->get("type");
        if ($ont == "MESH")
            if ($type == "descriptor")
                $type = "Term";
            else
                $type = "Synonym";
        $parsed = ["FSN"=> $row->get("FSN"), "type"=> $type,"ontology"=> $row->get("ontology")];
        array_push($matches, $parsed);
    }
    echo json_encode($matches);
}




?> 