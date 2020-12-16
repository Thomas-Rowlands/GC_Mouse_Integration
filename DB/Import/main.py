import argparse
import csv
import sys
import DB
import config


def load_ensemble_orthology(file):
    with open(file, newline='') as fin:
        reader = csv.DictReader(fin)
        for row in reader:
            import_to_mysql(row)
    return True


def import_to_mysql(orthology_data):
    con = DB.Connection(config.host, config.mouse_db, config.username, config.password)
    cursor = con.cursor
    try:
        import_package = [orthology_data["Gene name"], orthology_data["Chromosome/scaffold name"].upper(),
                          orthology_data["Gene start (bp)"], orthology_data["Gene end (bp)"],
                          orthology_data["Mouse gene name"], orthology_data["Mouse chromosome/scaffold name"].upper(),
                          orthology_data["Mouse chromosome/scaffold start (bp)"],
                          orthology_data["Mouse chromosome/scaffold end (bp)"],
                          orthology_data["Mouse homology type"], orthology_data["Mouse orthology confidence [0 low, "
                                                                                "1 high]"]]
        cursor.callproc('import_homology_data', import_package)
        con.close()
    except Exception as error:
        print(F"Import Failed: {error}")
        con.close()
        sys.exit()


# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Import data into GC_mouse')
    parser.add_argument('-snp', action="store_true", help='Link human snps to genes')
    args = parser.parse_args()
    if args.snp:
        import marker_mapping
        marker_mapping.MarkerMapper.start()
    else:
        load_ensemble_orthology("mart_export.txt")

# See PyCharm help at https://www.jetbrains.com/help/pycharm/
