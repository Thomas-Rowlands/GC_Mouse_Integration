
<?php
ini_set('display_errors', '0');
include 'database.php';

if (isset($_GET["entry"]) && isset($_GET["ontology"])) {
    $cmd = "";
    $ont = strtoupper($_GET["ontology"]);
    $entry = strtolower($_GET["entry"]);
    if ($ont == "MP") {
        $cmd = "MATCH p=(a)<-[:LOOM_MAPPING]-(n)-[:ISA]-(f)-[:ISA*0..]->(e{id: \"MP:0000001\"})
        WHERE toLower(n.FSN) STARTS WITH '" . $entry . "' AND (n:MP) AND n.isObsolete = \"false\" 
        RETURN DISTINCT reverse(COLLECT(f.FSN)), n.FSN as FSN, n.ontology as ontology LIMIT 5;";
    } else if ($ont == "HPO") {
        $cmd = "MATCH p=(a)-[:LOOM_MAPPING]->(n)-[:ISA]-(f)-[:ISA*0..]->(e{id: \"HP:0000001\"})
        WHERE toLower(n.FSN) STARTS WITH '" . $entry . "' AND (n:HPO) AND n.isObsolete = \"false\" 
        RETURN DISTINCT reverse(COLLECT(f.FSN)), n.FSN as FSN, n.ontology as ontology LIMIT 5;";
    } else if ($ont == "MESH") {
        $cmd = "MATCH p=(a)-[:LOOM_MAPPING]->(n)-[:ISA]-(f)-[:ISA*0..]->(e{id: \"mesh\"})
        WHERE toLower(n.FSN) STARTS WITH '" . $entry . "' AND (n:MESH) AND n.isObsolete = \"false\" 
        RETURN DISTINCT reverse(COLLECT(f.FSN)), n.FSN as FSN, n.ontology as ontology LIMIT 5;";
    }
    $neo = new Neo_Connection();
    $result = $neo->execute($cmd);
    $matches = [];
    foreach ($result as $row) {
        $parsed = ["FSN"=> $row->get("FSN"), "ontology"=> $row->get("ontology")];
        array_push($matches, $parsed);
    }
    echo json_encode($matches);
}




?> 