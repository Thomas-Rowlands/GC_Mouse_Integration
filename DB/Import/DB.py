import sys

import mysql.connector
from mysql.connector import errorcode
import Config


def insert(table, data, column_mapping, primary_key, unique_cols=None):
    """
    Insert a dictionary of data into a MySQL data table
    :param table: Data table name
    :param data: Dictionary of data to import
    :param column_mapping: Dictionary showing the data keys mapped to the data table column names
    :param primary_key: Name of the primary key column, used for avoiding auto increment jumps.
    :param unique_cols: List of column names which should only contain unique values
    """
    if unique_cols is None:
        unique_cols = []
    try:
        con = mysql.connector.connect(user=Config.user, password=Config.pwd, host=Config.host, database=Config.schema)
        cursor = con.cursor()
        cols = [x for x in data.keys()]
        valstring = ""
        for x in cols:
            valstring += "%s, "
        valstring = valstring[:-2]
        if unique_cols:
            data = __filter_duplicate_values(data, unique_cols)
        row_count = len(data[list(data.keys())[0]])
        colstring = ','.join(cols)
        for key in column_mapping:
            colstring = colstring.replace(key, column_mapping[key])
        for i in range(row_count):
            row_values = [data[key][i] for key in data.keys()]
            query = F"INSERT INTO {table} ({colstring}) VALUES ({valstring}) ON DUPLICATE KEY UPDATE {primary_key} = {primary_key}"
            try:
                cursor.execute(query, row_values)
            except mysql.connector.Error as err:
                if err.errno == errorcode.ER_DUP_ENTRY:
                    print(err)
                    continue
            print(cursor.statement)
        con.commit()
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            sys.exit("Access denied")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            sys.exit("Database does not exist")
        else:
            print(err)
            sys.exit(cursor.statement)  # Ignore warning, it IS actually in scope.
    else:
        cursor.close()
        con.close()


def insert_experiment(data):
    """
    Insert IMPC experiment data into the configured MySQL database
    :param data: Dictionary containing the experiment data from the IMPC CSV.
    """
    data = __filter_duplicate_rows(data)
    try:
        con = mysql.connector.connect(user=Config.user, password=Config.pwd, host=Config.host, database=Config.schema)
        cursor = con.cursor()
        for i in range(len(data[list(data.keys())[0]])):
            sex = ''
            if data['sex'][i].lower() == 'male':
                sex = 'M'
            elif data['sex'][i].lower() == 'female':
                sex = 'F'
            elif data['sex'][i].lower() == 'both':
                sex = 'B'
            else:
                sex = None
            marker = None
            zygosity = None
            p_val = None
            pipeline = None
            procedure = None
            parameter = None
            pheno_center = None
            last_inserted = 0
            if len(data['marker_symbol']) > i:
                if data['marker_symbol'][i] == '':
                    continue
                marker = data['marker_symbol'][i].lower()
            if len(data['zygosity']) > i:
                zygosity = data['zygosity'][i].lower()
            if len(data['p_value']) > i:
                if data['p_value'][i] == '':
                    continue
                p_val = float(data['p_value'][i])
            if len(data['pipeline_name']) > i:
                pipeline = data['pipeline_name'][i].lower()
            if len(data['procedure_name']) > i:
                procedure = data['procedure_name'][i].lower()
            if len(data['parameter_name']) > i:
                parameter = data['parameter_name'][i].lower()
            if len(data['phenotyping_center']) > i:
                pheno_center = data['phenotyping_center'][i].lower()
            result = cursor.callproc("insert_experiment", args=(
                sex, marker, zygosity, p_val, pipeline, procedure, parameter, pheno_center, 0))
            # con.commit()
            last_inserted = result[8]
            if not last_inserted:
                print(
                    F"DUPLICATE EXPERIMENT: {sex}-{marker}-{zygosity}-{p_val}-{pipeline}-{parameter}-{pheno_center}-{data['mp_term_name'][i]}")
                continue
            cursor.callproc("insert_experiment_phenotype", (last_inserted, data['mp_term_name'][i].lower()))
            # con.commit()
            split_top_phenos = data['top_level_mp_term_name'][i].lower().split(",")
            for pheno in split_top_phenos:
                cursor.callproc("insert_experiment_top_phenotype", (last_inserted, pheno))
            con.commit()
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            sys.exit("Access denied")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            sys.exit("Database does not exist")
        else:
            print(err)
            sys.exit(cursor.statement)  # Ignore warning, it IS actually in scope.
    except IndexError as err:
        print("Index error: Reached the end of clean data. Only rows with missing values remaining.")
    else:
        cursor.close()
        con.close()


def insert_human_markers(data):
    try:
        con = mysql.connector.connect(user=Config.user, password=Config.pwd, host=Config.host, database=Config.schema)
        cursor = con.cursor()
        for i in range(len(data)):
            symbol = data[i]
            result = cursor.callproc("insert_human_marker", args=(symbol, 0))
            con.commit()
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            sys.exit("Access denied")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            sys.exit("Database does not exist")
        else:
            print(err)
            sys.exit(cursor.statement)  # Ignore warning, it IS actually in scope.
    except IndexError as err:
        print("Index error: Reached the end of clean data. Only rows with missing values remaining.")
    else:
        cursor.close()
        con.close()


def insert_homolog_links(human_markers, mouse_markers):
    if len(human_markers) == len(mouse_markers):
        try:
            con = mysql.connector.connect(user=Config.user, password=Config.pwd, host=Config.host,
                                          database=Config.schema)
            cursor = con.cursor()
            for i in range(len(human_markers)):
                human = human_markers[i]
                mouse = mouse_markers[i]
                result = cursor.callproc("insert_human_mouse_homolog", args=(human, mouse, 0))
                if result[2] == 0:
                    print(F"Human or Mouse gene was not found in the database: {human} | {mouse}")
                con.commit()
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                sys.exit("Access denied")
            elif err.errno == errorcode.ER_BAD_DB_ERROR:
                sys.exit("Database does not exist")
            else:
                print(err)
                sys.exit(cursor.statement)  # Ignore warning, it IS actually in scope.
        except IndexError as err:
            print("Index error: Reached the end of clean data. Only rows with missing values remaining.")
        else:
            cursor.close()
            con.close()


def __filter_duplicate_values(input, unique_keys):
    temp = {key: [] for key in input.keys()}
    row_count = len(input[list(input.keys())[0]])
    for i in range(row_count):
        is_unique = True
        for uq_key in unique_keys:
            if input[uq_key][i] in temp[uq_key]:
                is_unique = False
        if is_unique:
            for key in input.keys():
                temp[key].append(input[key][i])
    return temp


def __filter_duplicate_rows(input):
    temp_list = []
    result = {x: [] for x in input.keys()}
    for i in range(len(input[list(input.keys())[0]])):
        row_list = []
        for key in input.keys():
            row_list.append(input[key][i])
        if row_list not in temp_list:
            temp_list.append(row_list)

    for row in temp_list:
        for i in range(len(row)):
            result[list(result.keys())[i]].append(row[i])
    return result
