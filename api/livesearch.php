
<?php
header('Content-Type: application/json');
 ini_set('display_errors', '0');
include 'database.php';

if (isset($_GET["entry"]) && isset($_GET["ontology"])) {
    $cmd = "";
    $ont = strtoupper($_GET["ontology"]);
    $entry = strtolower($_GET["entry"]);
    if ($ont == "HUMAN")
        $cmd = "MATCH (n:MESH)
                USING INDEX n:MESH(lowerFSN)
                WHERE n.lowerFSN = {entry} AND n.hasHumanData = TRUE
                OPTIONAL MATCH (m)-[:HAS_SYNONYM]->(n)
                
                RETURN COALESCE(m.id, n.id) AS id, COALESCE(m.FSN, n.FSN) AS FSN, COALESCE(m.originalType, 
                n.originalType) AS type, COALESCE(m.ontology, n.ontology) AS ontology,  n.FSN AS Term, n.id AS TermID
                LIMIT 1
                
                UNION 
                
                MATCH (n:HPO)
                USING INDEX n:HPO(lowerFSN)
                WHERE n.lowerFSN = {entry} AND n.hasHumanData = TRUE
                OPTIONAL MATCH (m)-[:HAS_SYNONYM]->(n)
                RETURN COALESCE(m.id, n.id) AS id, COALESCE(m.FSN, n.FSN) AS FSN, COALESCE(m.originalType, 
                n.originalType) AS type, COALESCE(m.ontology, n.ontology) AS ontology,  n.FSN AS Term, n.id AS TermID
                LIMIT 1
                
                UNION
                
                MATCH (n:MESH)
                USING INDEX n:MESH(lowerFSN)
                WHERE n.lowerFSN STARTS WITH {entry} AND n.hasHumanData = TRUE
                WITH n
                MATCH (o:HPO)
                USING INDEX o:HPO(lowerFSN)
                WHERE o.lowerFSN STARTS WITH {entry} AND o.hasHumanData = TRUE
                WITH COLLECT(n) + COLLECT(o) AS x
                UNWIND x AS n
                
                OPTIONAL MATCH (m)-[:HAS_SYNONYM]->(n)
                WITH n, m
                
                RETURN DISTINCT COALESCE(m.id, n.id) AS id, COALESCE(m.FSN, n.FSN) AS FSN, COALESCE(m.originalType, 
                n.originalType) AS type, COALESCE(m.ontology, n.ontology) AS ontology, n.FSN AS Term, n.id AS TermID
                ORDER BY FSN
                LIMIT 20
        ;";
    else
        $cmd = "MATCH (n:$ont)
                USING INDEX n:$ont(lowerFSN)
                WHERE n.lowerFSN = {entry} AND n.hasMouseData = TRUE
                OPTIONAL MATCH (m)-[:HAS_SYNONYM]->(n)
                RETURN COALESCE(m.id, n.id) AS id, COALESCE(m.FSN, n.FSN) AS FSN, COALESCE(m.originalType, 
                n.originalType) AS type, COALESCE(m.ontology, n.ontology) AS ontology,  n.FSN AS Term, n.id AS TermID
                LIMIT 1
                
                UNION 
                
                MATCH (n:$ont)
                USING INDEX n:$ont(lowerFSN)
                WHERE n.lowerFSN STARTS WITH {entry} AND n.hasMouseData = TRUE
                WITH n
                
                OPTIONAL MATCH (m)-[:HAS_SYNONYM]->(n)
                WITH n, m
                
                RETURN DISTINCT COALESCE(m.id, n.id) AS id, COALESCE(m.FSN, n.FSN) AS FSN, 
                COALESCE(m.originalType, n.originalType) AS type, COALESCE(m.ontology, n.ontology) AS ontology, 
                n.FSN AS Term, n.id AS TermID
                ORDER BY FSN
                LIMIT 20";
    $neo = new Neo_Connection();
    $result = $neo->execute($cmd, ['entry' => $entry]);
    $matches = [];
    foreach ($result as $row) {
        $type = $row->get("type");
        if ($type == "descriptor" || $type == "term")
            $type = "Term";
        else
            $type = "Synonym";
        $parsed = ["FSN"=> $row->get("FSN"), "type"=> $type,"ontology"=> $row->get("ontology"), "id"=> $row->get("id"),
            "term"=> $row->get("Term"), "termID"=> $row->get("TermID")];
        if (strtolower($row->get("FSN")) == $entry)
            array_unshift($matches, $parsed);
        else
            $matches[] = $parsed;
    }
    echo json_encode($matches);
}

