
<?php
header('Content-Type: application/json');
// ini_set('display_errors', '0');
include 'database.php';

if (isset($_GET["entry"]) && isset($_GET["ontology"])) {
    $cmd = "";
    $ont = strtolower($_GET["ontology"]);
    $entry = strtolower($_GET["entry"]);
    $cmd = "MATCH (n)
    WHERE n.ontology in [" . ($ont == "mp" ? "'mp'" : "'mesh', 'hpo'") . "] AND toLower(n.FSN) STARTS WITH {entry} AND n.isObsolete = \"false\" 
    WITH n
    OPTIONAL MATCH (n)<-[:HAS_SYNONYM]-(m)
    WITH n, m
    RETURN DISTINCT n.FSN AS FSN, n.originalType AS type, n.ontology AS ontology, COALESCE(n.id, m.id) AS id
    ORDER BY FSN
    ;";
    $neo = new Neo_Connection();
    $result = $neo->execute($cmd, ['entry' => $entry]);
    $matches = [];
    foreach ($result as $row) {
        $type = $row->get("type");
        if ($type == "descriptor" || $type == "term")
            $type = "Term";
        else
            $type = "Synonym";
        $parsed = ["FSN"=> $row->get("FSN"), "type"=> $type,"ontology"=> $row->get("ontology"), "id"=> $row->get("id")];
        if (strtolower($row->get("FSN")) == $entry)
            array_unshift($matches, $parsed);
        else
            array_push($matches, $parsed);
    }
    echo json_encode($matches);
}

?> 