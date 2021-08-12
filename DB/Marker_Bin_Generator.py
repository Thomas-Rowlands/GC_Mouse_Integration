import mysql.connector


class BinBuilder:

    def __init__(self):
        self.db_connection = mysql.connector.connect(host="localhost", database="GC_study", user="root",
                                                     password="Maggie7803GB!")
        self.db = self.db_connection.cursor()
        # Chromosome lengths taken from https://www.ncbi.nlm.nih.gov/grc/human/data?asm=GRCh37
        self.__chromosomes = {
            1: 249250621,
            2: 243199373,
            3: 198022430,
            4: 191154276,
            5: 180915260,
            6: 171115067,
            7: 159138663,
            8: 146364022,
            9: 141213431,
            10: 135534747,
            11: 135006516,
            12: 133851895,
            13: 115169878,
            14: 107349540,
            15: 102531392,
            16: 90354753,
            17: 81195210,
            18: 78077248,
            19: 59128983,
            20: 63025520,
            21: 48129895,
            22: 51304566,
            "X": 155270560,
            "Y": 59373566
        }

    def close_connection(self):
        self.db.close()
        self.db_connection.close()
        self.db_connection.disconnect()

    def get_used_mesh_phenotypes(self):
        cmd = """
        SELECT DISTINCT pa.PhenotypeIdentifier
        FROM GC_study.Study AS s
            INNER JOIN GC_study.Experiment AS e ON e.StudyID = s.StudyID
            INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.PhenotypeMethodID = e.PhenotypeMethodID
            INNER JOIN GC_study.PPPA AS ppp ON ppp.PhenotypePropertyID = pm.PhenotypePropertyID
            INNER JOIN GC_study.PhenotypeAnnotation AS pa ON pa.PhenotypeAnnotationID = ppp.PhenotypeAnnotationID
            INNER JOIN GC_study.Resultset AS rs ON rs.ExperimentID = e.ExperimentID
            INNER JOIN GC_study.Significance AS si ON si.ResultsetID = rs.ResultsetID
            INNER JOIN GC_study.Usedmarkerset AS us ON us.UsedmarkersetID = si.UsedmarkersetID
            INNER JOIN GC_marker.Marker AS m ON m.Identifier = us.MarkerIdentifier
            INNER JOIN GC_marker.MarkerCoord AS mc ON mc.MarkerID = m.MarkerID;
        """
        results = self.db.execute(cmd,  multi=True)
        terms = []
        for result in results:
            if result.with_rows:
                terms = [x for [(x)] in result.fetchall()]
        return terms

    def get_chromosome_id(self, chromosome):
        cmd = F"SELECT id FROM gc_mouse.chromosomes WHERE name = '{chromosome}'"
        results = self.db.execute(cmd, multi=True)
        id = None
        for result in results:
            if result.with_rows:
                id = result.fetchall()[0][0]
        return id

    def insert_phenotype_bin_value(self, term_id, start, stop, chromosome):
        cmd = F"""INSERT INTO GC_bin.HumanMarkers (chromosome_id, start, stop, value, mesh_id) 
                VALUES ({self.get_chromosome_id(chromosome)}, {start}, {stop},
               (
                    SELECT COUNT(*)
                    FROM GC_study.Study AS s
                        INNER JOIN GC_study.Experiment AS e ON e.StudyID = s.StudyID
                        INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.PhenotypeMethodID = e.PhenotypeMethodID
                        INNER JOIN GC_study.PPPA AS ppp ON ppp.PhenotypePropertyID = pm.PhenotypePropertyID
                        INNER JOIN GC_study.PhenotypeAnnotation AS pa ON pa.PhenotypeAnnotationID = ppp.PhenotypeAnnotationID
                        INNER JOIN GC_study.Resultset AS rs ON rs.ExperimentID = e.ExperimentID
                        INNER JOIN GC_study.Significance AS si ON si.ResultsetID = rs.ResultsetID
                        INNER JOIN GC_study.Usedmarkerset AS us ON us.UsedmarkersetID = si.UsedmarkersetID
                        INNER JOIN GC_marker.Marker AS m ON m.Identifier = us.MarkerIdentifier
                        INNER JOIN GC_marker.MarkerCoord AS mc ON mc.MarkerID = m.MarkerID
                    WHERE mc.Chr = '{chromosome}' AND mc.Start > {start} and mc.Stop < {stop} AND pa.PhenotypeIdentifier = '{term_id}'
               ), 
               '{term_id}')"""
        self.db.execute(cmd, multi=True)
        self.db_connection.commit()

    def build_marker_bins(self):
        mesh_terms = self.get_used_mesh_phenotypes()
        for term in mesh_terms:
            for chromosome in self.__chromosomes:
                i = 1
                while i < self.__chromosomes[chromosome]:
                    if i + 30000 > self.__chromosomes[chromosome]:
                        self.insert_phenotype_bin_value(term, i, self.__chromosomes[chromosome], chromosome)
                    else:
                        self.insert_phenotype_bin_value(term, i, i + 30000, chromosome)
                    i += 30000



if __name__ == "__main__":
    builder = BinBuilder()
    builder.build_marker_bins()
