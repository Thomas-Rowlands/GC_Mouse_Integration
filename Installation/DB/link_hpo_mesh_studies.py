from py2neo import Graph


def read_mapping_file(input_file):
    mappings = {}
    with open(input_file, "r") as f_in:
        for line in f_in.readlines():
            data_list = line.split("\t")
            mappings[data_list[0]] = [x for x in data_list[1].split(",")]
    return mappings


def set_hpo_relationships(mappings):
    """
    Add the "hasGWASResult" relationship in Neo4J between input HPO term and provided MeSH terms.
    :param mappings: Dictionary with hpo(string)->mesh(list[string]) structure.
    :type mappings: Dict
    :return:
    :rtype:
    """
    g = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
    for hpo_term in mappings.keys():
        for mesh_term in mappings[hpo_term]:
            g.run(F"""
            MATCH (n:MESH)-[:hasGWASResult]->(m)
            WHERE n.id = '{mesh_term}'
            WITH m
            MATCH (n:HPO)
            WHERE n.id = '{hpo_term}'
            MERGE (n)-[:hasGWASResult]->(m)
            """)


input_mappings = read_mapping_file("Hpo2MeSHv2.tab")
set_hpo_relationships(input_mappings)
