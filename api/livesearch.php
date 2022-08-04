
<?php
header('Content-Type: application/json');
// ini_set('display_errors', '0');
include 'database.php';

if (isset($_GET["entry"]) && isset($_GET["ontology"])) {
    $cmd = "";
    $ont = strtolower($_GET["ontology"]);
    if ($ont == "human")
        $ont = "'mesh', 'hpo'";
    $entry = strtolower($_GET["entry"]);
    $cmd = "MATCH (n)
    WHERE n.ontology in [{ont}] AND toLower(n.FSN) STARTS WITH {entry} 
    AND n.isObsolete = \"false\" AND (n.gwas_total > 0 or n.experiment_total > 0)
    WITH n
    OPTIONAL MATCH (n)<-[:HAS_SYNONYM]-(m)
    WITH n, m
    RETURN DISTINCT n.FSN AS FSN, n.originalType AS type, n.ontology AS ontology, COALESCE(n.id, m.id) AS id, COALESCE(m.FSN, n.FSN) AS Term, COALESCE(m.id, n.id) AS TermID
    ORDER BY FSN
    LIMIT 6
    ;";
    $neo = new Neo_Connection();
    $result = $neo->execute($cmd, ['entry' => $entry, 'ont' => $ont]);
    $matches = [];
    foreach ($result as $row) {
        $type = $row->get("type");
        if ($type == "descriptor" || $type == "term")
            $type = "Term";
        else
            $type = "Synonym";
        $parsed = ["FSN"=> $row->get("FSN"), "type"=> $type,"ontology"=> $row->get("ontology"), "id"=> $row->get("id"), "term"=> $row->get("Term"), "termID"=> $row->get("TermID")];
        if (strtolower($row->get("FSN")) == $entry)
            array_unshift($matches, $parsed);
        else
            $matches[] = $parsed;
    }
    echo json_encode($matches);
}

