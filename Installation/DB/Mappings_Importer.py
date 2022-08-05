from py2neo import Graph
from py2neo.bulk import create_relationships


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
    :param input_mappings:
    :type input_mappings:
    :return: None
    :rtype: None
    """
    try:
        hp_mapping_data = [
            ((x.hp_id, x.hp_label), {"relation": "EXACT", "type": x.mapping_source}, (x.mp_id, x.mp_label)) for x in
            input_mappings if x.hp_id]
        mesh_mapping_data = [
            ((x.mesh_id, x.mesh_label), {"relation": "EXACT", "type": x.mapping_source}, (x.mp_id, x.mp_label)) for x in
            input_mappings if x.mesh_id]
        g = Graph(scheme="bolt", host="localhost", password="12345")
        create_relationships(g.auto(), hp_mapping_data, "SPECIES_MAPPING", start_node_key=("HPO", "id", "FSN"),
                             end_node_key=("MP", "id", "FSN"))
        create_relationships(g.auto(), mesh_mapping_data, "SPECIES_MAPPING", start_node_key=("MESH", "id", "FSN"),
                             end_node_key=("MP", "id", "FSN"))
    except ConnectionRefusedError as cre:
        print(cre)
    except Exception as e:
        print(e)


def read_mappings_file(file_path):
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


new_mappings = read_mappings_file("Ontology Mappings_v3.tsv")
update_database(new_mappings)
