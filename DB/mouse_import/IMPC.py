import csv

import config
import mysql.connector
import DB


def begin_import():
    """
    Retrieves IMPC data from a specified local file
    :return: List of ordered dicts representing rows of the IMPC data
    """
    with open(config.impc_file) as file:
        reader = csv.DictReader(file)
        for row in reader:
            input_impc_data([row])


def input_impc_data(data):
    """
    Inserts IMPC data into the configured MySQL database.
    :param data: Dictionary containing the IMPC CSV file's data.
    """
    con = mysql.connector.connect(user=config.username, password=config.password, host=config.host,
                                  database=config.mouse_db)
    cursor = con.cursor()

    # Import procedures
    procedure_keys = ["procedure_name", "procedure_stable_id"]
    procedures = {procedure_key: [x[procedure_key] for x in data if x[procedure_key]] for procedure_key in
                  procedure_keys}
    DB.insert("Procedures", procedures, {"procedure_name": "name", "procedure_stable_id": "procedure_stable_id"},
              primary_key="procedures_id", cursor=cursor, con=con, unique_cols=procedure_keys)
    # Import pipelines
    pipeline_keys = ["pipeline_name", "pipeline_stable_id"]
    pipelines = {pipeline_key: [x[pipeline_key] for x in data if x[pipeline_key]] for pipeline_key in
                 pipeline_keys}
    DB.insert("Pipelines", pipelines, {"pipeline_name": "name", "pipeline_stable_id": "pipeline_stable_id"},
              primary_key="pipelines_id", cursor=cursor, con=con, unique_cols=pipeline_keys)
    # Import parameters
    parameter_keys = ["parameter_name", "parameter_stable_id"]
    parameters = {parameter_key: [x[parameter_key] for x in data if x[parameter_key]] for parameter_key in
                  parameter_keys}
    DB.insert("Parameters", parameters, {"parameter_name": "name", "parameter_stable_id": "parameter_stable_id"},
              primary_key="parameters_id", cursor=cursor, con=con, unique_cols=parameter_keys)
    # Import markers
    marker_keys = ["marker_symbol", "marker_accession_id", "allele_accession_id", "allele_symbol"]
    markers = {marker_key: [x[marker_key] for x in data if x[marker_key]] for marker_key in
               marker_keys}
    DB.insert("Mouse_Markers", markers, {"marker_symbol": "marker_symbol", "marker_accession_id": "marker_accession_id",
                                         "allele_accession_id": "allele_accession_id", "allele_symbol": "allele_symbol"}
              , primary_key="mouse_gene_id", cursor=cursor, con=con, unique_cols=marker_keys)
    # Import MP terms used
    mp_keys = ["top_level_mp_term_id", "top_level_mp_term_name"]
    mp_keys_two = ["mp_term_id", "mp_term_name"]
    mp_terms = {mp_key: [x[mp_key] for x in data if x[mp_key]] for mp_key in
                mp_keys}
    mp_terms = split_multi_value_cols(mp_terms, ",")
    mp_terms_two = {mp_key: [x[mp_key] for x in data if x[mp_key]] for mp_key in
                    mp_keys_two}
    DB.insert("MP_Phenotypes", mp_terms, {"top_level_mp_term_id": "mp_term_id", "top_level_mp_term_name": "term_name"},
              primary_key="mp_phenotype_id", cursor=cursor, con=con, unique_cols=mp_keys)
    DB.insert("MP_Phenotypes", mp_terms_two, {"mp_term_id": "mp_term_id", "mp_term_name": "term_name"},
              primary_key="mp_phenotype_id", cursor=cursor, con=con, unique_cols=mp_keys_two)
    # Insert Zygosity values
    DB.insert("Zygosity", {"name": ["Heterozygote", "Homozygote", "Hemizygote"]}, {"name": "name"},
              primary_key="zygosity_id",
              cursor=cursor, con=con, unique_cols=["name"])
    # Import phenotyping centers
    phenotyping_center_keys = ["phenotyping_center"]
    phenotyping_centers = {phenotyping_center_key: [x[phenotyping_center_key] for x in data if x[phenotyping_center_key]
                                                    ] for phenotyping_center_key in phenotyping_center_keys}
    DB.insert("Phenotyping_Center", phenotyping_centers, {"phenotyping_center": "name"},
              primary_key="phenotyping_center_id", cursor=cursor, con=con, unique_cols=phenotyping_center_keys)
    # Import experiments
    # TODO: Sort out the possible multi-value cell cases (e.g. phenotypes)
    experiment_keys = ["male_mutant_count", "female_mutant_count", "marker_symbol", "zygosity", "p_value", "pipeline_name",
                       "procedure_name", "procedure_stable_key", "parameter_stable_key", "parameter_name",
                       "phenotyping_center", "mp_term_name", "top_level_mp_term_name"]
    experiments = {experiment_key: [x[experiment_key] for x in data] for experiment_key in experiment_keys}
    DB.insert_experiment(experiments, cursor, con)


def split_multi_value_cols(data, divider):
    """
    Splits cells containing multiple values by the given divider, creating a new row
    :param data: Dictionary containing
    :param divider:
    :return:
    """
    temp = {}
    for key in data.keys():
        temp[key] = []
    row_count = len(data[list(data.keys())[0]])
    for i in range(row_count):
        for key in data.keys():
            for val in data[key][i].split(divider):
                temp[key].append(val)
    # validate rows align
    lengths = []
    for key in temp.keys():
        lengths.append(len(temp[key]))
    for val in lengths:
        if val != lengths[0]:
            return False
    return temp


def get_human_phenotype_data():
    """
    Retrieves human to mouse homology data from a specified local file.
    :return: Dictionary of columns containing a value for each row.
    """
    result = {"Human Marker Symbol": [], "Human Entrez Gene ID": [], "HomoloGene ID": [],
              "HGNC Association": [], "Mouse Marker Symbol": [], "MGI Marker Accession ID": [],
              "Mamallian Phenotype ID": []}
    with open(config.human_mouse_homology_file) as file:
        rows = (x.split('\t') for x in file)
        for row in rows:
            result["Human Marker Symbol"].append(row[0])
            result["Human Entrez Gene ID"].append(row[1])
            result["HomoloGene ID"].append(row[2])
            result["HGNC Association"].append(row[3])
            result["Mouse Marker Symbol"].append(row[4])
            result["MGI Marker Accession ID"].append(row[5])
            result["Mamallian Phenotype ID"].append(row[6])
    return result
