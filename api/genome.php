<?php
    include_once 'database.php';

    class Genome {

        public function __construct()
        {
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function getPhenotypeMarkers($termID)
        {
            $ont = new Ontology();
            $descendants = $ont->get_term_descendants($termID, "MESH");
            array_push($descendants, $termID);
            $result = [];
            $term_string = "";
            foreach ($descendants as $descendant) {
                $term_string .= "'" . str_replace(" ", "", $descendant) . "',";
            }
            $term_string = rtrim($term_string, ",");
            $cmd = "SELECT DISTINCT mc.MarkerID AS 'name', mc.Chr AS 'chr', mc.Start AS 'start', mc.Stop AS 'stop'
            FROM gc_study.study AS s
            INNER JOIN GC_study.Experiment AS e ON e.StudyID = s.StudyID
            INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.PhenotypeMethodID = e.PhenotypeMethodID
            INNER JOIN GC_study.PPPA AS ppp ON ppp.PhenotypePropertyID = pm.PhenotypePropertyID
            INNER JOIN GC_study.PhenotypeAnnotation AS pa ON pa.PhenotypeAnnotationID = ppp.PhenotypeAnnotationID
            INNER JOIN GC_study.resultset AS rs ON rs.ExperimentID = e.ExperimentID
            INNER JOIN GC_study.significance AS si ON si.ResultsetID = rs.ResultsetID
            INNER JOIN GC_study.usedmarkerset AS us ON us.UsedmarkersetID = si.UsedmarkersetID
            INNER JOIN gc_marker.marker AS m ON m.Identifier = us.MarkerIdentifier
            INNER JOIN gc_marker.markercoord AS mc ON mc.MarkerID = m.MarkerID
            WHERE pa.PhenotypeIdentifier in (" . $term_string . ") AND si.NegLogPValue >= 0";
            $markers_result = $this->con->execute($cmd, "gc_mouse");
            if ($markers_result) {
                $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                foreach ($markers as $marker) {
                    array_push($result, $marker);
                }
            }
            
            if ($result)
                return $result;
            else
                return [];

        }
    }

?>