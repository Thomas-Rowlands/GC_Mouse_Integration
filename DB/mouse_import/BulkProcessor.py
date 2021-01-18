import config
import mysql

import DB
from pyliftover import LiftOver
from gtfparse import read_gtf
import json
import csv


def __get_gene_list():
    genes = read_gtf("Homo_sapiens.GRCh38.102.chr.gtf",
                     usecols=["feature", "seqname", "start", "end", "gene_name"])
    genes = genes[genes.feature == "gene"]
    chroms = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18',
              '19', '20', '21', '22', 'X', 'Y', 'MT']
    chrom_genes = {}
    for chrom in chroms:
        chrom_genes[chrom] = genes[(genes["seqname"] == chrom)].values.tolist()
    return chrom_genes


def __get_markers(file_path):
    with open(file_path, "r", encoding="utf-8") as fin:
        return json.load(fin)


def __get_genes_for_markers(genes, markers):
    marker_genes = {}
    for marker in markers:
        marker_genes[marker[1]] = [x for x in genes[str(marker[2])] if
                                   x[2] <= marker[3] <= x[3] or x[2] <= marker[4] <= x[3]]
    return marker_genes


def __export_lifted_markers(markers):
    output = []
    for marker in markers:
        if marker:
            output.append([marker[0], marker[3], marker[4]])
    with open("lifted_markers_dump.csv", "a", newline="") as f_out:
        writer = csv.writer(f_out)
        writer.writerows(output)


def __link_markers(markers, cursor):
    insert_marker_stmt = "CALL insert_lifted_marker(%s, %s, %s)"
    insert_marker_data = []
    for marker in markers:
        if marker:
            insert_marker_data.append((marker[1], str(marker[3]), str(marker[4])))
    cursor.executemany(insert_marker_stmt, insert_marker_data)
    print("done")
    # for marker in markers.keys():
    #     if markers[marker]:
    #         try:
    #             cursor.callproc("insert_lifted_marker", args=(marker, markers[marker][0][2], markers[marker][0][3]))
    #         except mysql.connector.errors.IntegrityError as ie:
    #             if ie.errno == 1062:
    #                 pass
    #         for match in markers[marker]:
    #             try:
    #                 cursor.callproc("link_human_marker", args=(marker, match[4]))
    #             except mysql.connector.errors.IntegrityError as ie:
    #                 if ie.errno == 1062:
    #                     pass
    #     else:
    #         cursor.callproc("link_human_marker", args=(marker, "NA_UNKNOWN"))


def process_files(start, stop):
    con = DB.Connection(config.host, config.mouse_db, config.username, config.password)
    cursor = con.cursor
    # genes = __get_gene_list()
    for i in range(start, stop):
        print(F"Starting file markers{i}.json")
        markers = __get_markers(F"MarkerDump/markers{i}.json")
        # __link_markers(markers, cursor)
        __export_lifted_markers(markers)
        print(F"Finished file markers{i}.json")
