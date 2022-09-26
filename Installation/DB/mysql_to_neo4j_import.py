from py2neo import Graph
from mysql import connector
import sys


class ExperimentImporter:

    def __init__(self):
        self.__mysql_connect()
        self.__neo4j_connect()

    def __mysql_connect(self):
        try:
            self.my_sql_con = connector.connect(host="localhost", database="gc_mouse", user="root",
                                        password="")
            self.sql_cursor = self.my_sql_con.cursor(dictionary=True)
        except Exception as ex:
            sys.exit(ex)
        return

    def __neo4j_connect(self):
        try:
            self.neo_con = Graph(scheme="bolt", host="localhost", password="")
        except Exception as ex:
            sys.exit(ex)
        return

    def import_parameters(self):
        cmd = "SELECT name FROM parameters;"
        results = self.sql_cursor.execute(cmd, multi=True)
        if results:
            for result in self.sql_cursor:
                neo_cmd = "MERGE (n:Parameter {name: \"" + result["name"] + "\"})"
                self.neo_con.run(neo_cmd)
        return

    def import_procedures(self):
        cmd = "SELECT name FROM procedures;"
        results = self.sql_cursor.execute(cmd, multi=True)
        if results:
            for result in self.sql_cursor:
                neo_cmd = "MERGE (n:Procedure {name: \"" + result["name"] + "\"})"
                self.neo_con.run(neo_cmd)
        return

    def import_genes(self):
        cmd = "SELECT gene_symbol FROM mouse_genes;"
        results = self.sql_cursor.execute(cmd, multi=True)
        if results:
            for result in self.sql_cursor:
                neo_cmd = "MERGE (n:Gene {name: \"" + result["gene_symbol"] + "\"})"
                self.neo_con.run(neo_cmd)
        return

    def import_experiments(self):
        """

        :param neo_con:
        :param my_con:
        :return:
        """
        cmd = """SELECT e.experiments_id, mg.gene_symbol AS "Gene", mm.marker_accession_id AS "Gene Key", e.male_count AS "Males", 
                e.female_count AS "Females", ROUND(LOG((CONVERT(e.p_value, DECIMAL(30, 30)) + 0)) * -1, 3) AS "-log P-value", 
                pr.name AS "Procedure", pa.name AS "Parameter", mptl.mp_term_id AS 'term_name',
                 mp.mp_term_id AS 'top_level_term_name'
                FROM experiments AS e
                INNER JOIN experiment_top_level_phenotypes AS etp ON etp.experiment_id = e.experiments_id
                INNER JOIN experiment_phenotypes AS ep ON ep.experiment_id = e.experiments_id
                INNER JOIN mp_phenotypes AS mptl ON mptl.mp_phenotype_id = etp.phenotype_id
                INNER JOIN mp_phenotypes AS mp ON mp.mp_phenotype_id = ep.phenotype_id
                INNER JOIN mouse_markers AS mm ON mm.mouse_gene_id = e.mouse_marker_id
                INNER JOIN mouse_genes AS mg ON mg.id = mm.mouse_gene_id
                INNER JOIN parameters AS pa ON pa.parameters_id = e.parameter_id
                INNER JOIN experiment_parameter AS expa ON expa.experiment_id = e.experiments_id
                INNER JOIN procedures AS pr ON pr.procedures_id = e.procedure_id
                INNER JOIN experiment_procedure AS expr ON expr.experiment_id = e.experiments_id
                WHERE ROUND(LOG((CONVERT(e.p_value, DECIMAL(30, 30)) + 0)) * -1, 3) > 0"""
        results = self.sql_cursor.execute(cmd, multi=True)
        if results:
            for result in self.sql_cursor:
                neo_cmd = F"""
                    MERGE (e:Experiment {{id: \"{result["experiments_id"]}\", maleCount: {result["Males"]}, 
                    femaleCount: {result["Females"]}}})-[:studiesTheGene]->(g:Gene {{name: \"{result["Gene"]}\", 
                    mgi: \"{result["Gene Key"]}\"}})
                    WITH e
                    MERGE (e)-[:usesProcedure]->(p:Procedure {{name: \"{result["Procedure"]}\"}})
                    WITH e
                    MERGE (e)-[:assessesParameter]->(p:Parameter {{name: \"{result["Parameter"]}\"}})
                    WITH e
                    MATCH (e), (n:MP {{id: \"{result["term_name"]}\"}}), 
                    (m:MP {{id: \"{result["top_level_term_name"]}\"}})
                    WITH e, n, m
                    MERGE (e)-[:containsExperimentResult]->(r:Result 
                    {{value: {result["-log P-value"]}}})<-[:hasExperimentResult]-(n)
                    WITH r, m
                    MERGE (m)-[:hasExperimentResult]->(r)
                """
                self.neo_con.run(neo_cmd)
        return

    def run(self):
        print("Importing parameters...")
        self.import_parameters()
        print("Importing procedures...")
        self.import_procedures()
        print("Importing genes...")
        self.import_genes()
        print("Importing experiments...")
        self.import_experiments()
        print("Done!")


def main():
    importer = ExperimentImporter()
    importer.run()


if __name__ == "__main__":
    main()
