from py2neo import Graph
from py2neo.bulk import create_relationships, merge_relationships


class Mapping:
    def __init__(self, mapping_row):
        self.mp_id = None
        self.mp_label = None
        self.mesh_id = None
        self.mesh_label = None
        self.hp_id = None
        self.hp_label = None
        self.mapping_source = None
        self.parse_row(mapping_row)

    def parse_row(self, row):
        cells = row.split("\t")
        # validate at least 1 mapping exists in this row
        if cells[2] or cells[4]:
            self.mp_id = cells[0].upper()
            self.mp_label = cells[1]
            self.mesh_id = cells[2].upper()
            self.mesh_label = cells[3]
            self.hp_id = cells[4]
            self.hp_label = cells[5]
            self.mapping_source = cells[6].upper()


def update_database(input_mappings: list):
    """
    Bulk imports the provided mapping data into the Neo4J graph database.
    :param input_mappings: Mappings for new Neo4J relationships.
    :type input_mappings: List[Mapping]
    """
    try:
        hp_mapping_data = [
            ((x.hp_id, x.hp_label), {"relation": "EXACT", "type": x.mapping_source}, (x.mp_id, x.mp_label)) for x in
            input_mappings if x.hp_id]
        mesh_mapping_data = [
            ((x.mesh_id, x.mesh_label), {"relation": "EXACT", "type": x.mapping_source}, (x.mp_id, x.mp_label)) for x in
            input_mappings if x.mesh_id]
        g = Graph(scheme="bolt", host="localhost", password="12345")
        merge_relationships(g.auto(), hp_mapping_data, "SPECIES_MAPPING", start_node_key=("HPO", "id", "FSN"),
                             end_node_key=("MP", "id", "FSN"))
        merge_relationships(g.auto(), mesh_mapping_data, "SPECIES_MAPPING", start_node_key=("MESH", "id", "FSN"),
                             end_node_key=("MP", "id", "FSN"))
    except ConnectionRefusedError as cre:
        print(cre)
    except Exception as e:
        print(e)


def read_mappings_file(file_path):
    """
    Parse the input TSV file's mappings into a list of Mapping objects.
    :param file_path: Path of the mappings TSV file.
    :type file_path: str
    :return: mappings: List of mapping objects
    :rtype: list[Mapping]
    """
    mappings = []
    skip_headers = True
    try:
        with open(file_path, "r") as fin:
            for line in fin.readlines():
                if skip_headers:
                    skip_headers = False
                    continue
                mappings.append(Mapping(line))
    except FileNotFoundError:
        print("Mappings file not found.")
        return None
    except Exception as e:
        print(e)
        return None
    return mappings


def reset_relationships():
    """
    Remove all current SPECIES_MAPPING relationships in the database.
    """
    try:
        g = Graph(scheme="bolt", host="localhost", password="12345")
        g.run("""MATCH ()-[r:SPECIES_MAPPING]-()
        DELETE r """)
    except SyntaxError as se:
        print(se)
    except ConnectionRefusedError as cre:
        print(cre)
    except Exception as e:
        print(e)


def create_inverted_relationship_directions():
    """
    Create reverse direction, exact SPECIES_MAPPING relationships between ontology nodes.
    """
    try:
        g = Graph(scheme="bolt", host="localhost", password="12345")
        g.run("""MATCH (n)-[r:SPECIES_MAPPING {relation: "EXACT"}]->(o)
        MERGE (o)-[:SPECIES_MAPPING {type: r.type, relation: "EXACT"}]->(n)""")
    except ConnectionRefusedError as cre:
        print(cre)
    except Exception as e:
        print(e)


def create_inferred_relationships():
    """
    Create inferred SPECIES_MAPPING relationships between ontology nodes.
    """
    try:
        g = Graph(scheme="bolt", host="localhost", password="12345")
        g.run("""MATCH (n)<-[:ISA*1..]-(m)-[r:SPECIES_MAPPING]->(o)
        MERGE (n)-[:SPECIES_MAPPING {type: r.type, relation: "INFERRED"}]->(o)""")
    except ConnectionRefusedError as cre:
        print(cre)
    except Exception as e:
        print(e)


def create_term_properties():
    """
    Create mapping-related node properties.
    """
    try:
        g = Graph(scheme="bolt", host="localhost", password="12345")
        # MESH exact mapping properties
        g.run("""MATCH (n:MESH)-[r:SPECIES_MAPPING {relation: 'EXACT'}]->(m:MP)
        SET n.hasExactMPMapping = true, m.hasExactMESHMapping = true""")
        # HPO exact mapping properties
        g.run("""MATCH (n:HPO)-[r:SPECIES_MAPPING {relation: 'EXACT'}]->(m:MP)
        SET n.hasExactMPMapping = true, m.hasExactHPOMapping = true""")
        # MESH inferred mapping properties
        g.run("""MATCH (n:MESH)-[r:SPECIES_MAPPING {relation: 'INFERRED'}]->(m:MP)
        SET n.hasInferredMPMapping = true, m.hasInferredMESHMapping = true""")
        # HPO inferred mapping properties
        g.run("""MATCH (n:HPO)-[r:SPECIES_MAPPING {relation: 'INFERRED'}]->(m:MP)
        SET n.hasInferredMPMapping = true, m.hasInferredHPOMapping = true""")
    except SyntaxError as se:
        print(se)
    except ConnectionRefusedError as cre:
        print(cre)
    except Exception as e:
        print(e)


def reset_term_properties():
    """
    Remove mapping-related node properties.
    """
    try:
        g = Graph(scheme="bolt", host="localhost", password="12345")
        g.run("""MATCH (n)
        SET n.hasExactHPOMapping = false, n.hasExactMESHMapping = false, n.hasExactMPMapping = false,
        n.hasInferredHPOMapping = false, n.hasInferredMESHMapping = false, n.hasInferredMPMapping = false""")
    except SyntaxError as se:
        print(se)
    except ConnectionRefusedError as cre:
        print(cre)
    except Exception as e:
        print(e)


def create_inferred_result_relationships():
    try:
        g = Graph(scheme="bolt", host="localhost", password="12345")
        # MP Ontology
        print("Adding inferred MP Experiment relationships")
        mp_terms = [x['n.id'] for x in g.query("MATCH (n:MP) WHERE n.id <> 'MP:0000001' RETURN DISTINCT n.id").data()]
        for term in mp_terms:
            print(str(term))
            child_terms = g.query(
                F"MATCH (n:MP {{id: '{term}'}})<-[:ISA*1..]-(m) USING INDEX n:MP(id) RETURN DISTINCT m.id AS id")
            child_terms = [x['id'] for x in child_terms.data()]
            if not child_terms:
                continue
            gwas_results = []
            for child in child_terms:
                result = g.query(
                    F"MATCH (r)<-[:hasExperimentResult]-(n:MP {{id: '{child}'}}) USING INDEX n:MP(id) RETURN DISTINCT ID(r) AS result_id")
                gwas_results += [x['result_id'] for x in result.data()]
            combined_list = []
            if gwas_results:
                gwas_results = list(set(gwas_results))
                combined_list = [(term, {}, x) for x in gwas_results]
                merge_relationships(g.auto(), combined_list, "hasExperimentResult", start_node_key=("MP", "id"))
            del child_terms, combined_list
        del mp_terms
        # HPO Ontology
        print("Adding inferred HPO GWAS relationships")
        hpo_terms = [x['n.id'] for x in g.query("MATCH (n:HPO) WHERE n.id <> 'HP:0000001' RETURN DISTINCT n.id").data()]
        for term in hpo_terms:
            print(str(term))
            child_terms = g.query(
                F"MATCH (n:HPO {{id: '{term}'}})<-[:ISA*1..]-(m) USING INDEX n:HPO(id) RETURN DISTINCT m.id AS id")
            child_terms = [x['id'] for x in child_terms.data()]
            if not child_terms:
                continue
            gwas_results = []
            for child in child_terms:
                result = g.query(
                    F"MATCH (r)<-[:hasGWASResult]-(n:HPO {{id: '{child}'}}) USING INDEX n:HPO(id) RETURN DISTINCT ID(r) AS result_id")
                gwas_results += [x['result_id'] for x in result.data()]
            combined_list = []
            if gwas_results:
                gwas_results = list(set(gwas_results))
                combined_list = [(term, {}, x) for x in gwas_results]
                merge_relationships(g.auto(), combined_list, "hasGWASResult", start_node_key=("HPO", "id"))
            del child_terms, combined_list
        del hpo_terms
        # MESH Ontology
        # print("Adding inferred MESH GWAS relationships")
        # mesh_terms = [x['n.id'] for x in g.query("MATCH (n:MESH) WHERE n.id <> 'mesh' RETURN DISTINCT n.id").data()]
        # for term in mesh_terms:
        #     print(str(term))
        #     child_terms = g.query(F"MATCH (n:MESH {{id: '{term}'}})<-[:ISA*1..]-(m) USING INDEX n:MESH(id) RETURN DISTINCT m.id AS id")
        #     child_terms = [x['id'] for x in child_terms.data()]
        #     if not child_terms:
        #         continue
        #     gwas_results = []
        #     for child in child_terms:
        #         result = g.query(F"MATCH (r)<-[:hasGWASResult]-(n:MESH {{id: '{child}'}}) USING INDEX n:MESH(id) RETURN DISTINCT ID(r) AS result_id")
        #         gwas_results += [x['result_id'] for x in result.data()]
        #     combined_list = []
        #     if gwas_results:
        #         gwas_results = list(set(gwas_results))
        #         combined_list = [(term, {}, x) for x in gwas_results]
        #         merge_relationships(g.auto(), combined_list, "hasGWASResult", start_node_key=("MESH", "id"))
        #     del child_terms, combined_list
        # del mesh_terms
    except Exception as e:
        print(e)


new_mappings = read_mappings_file("Ontology Mappings_v4.tsv")
if new_mappings:
    reset_relationships()
    reset_term_properties()
    update_database(new_mappings)
    create_inverted_relationship_directions()
    create_inferred_relationships()
    create_term_properties()
# create_inferred_result_relationships()
