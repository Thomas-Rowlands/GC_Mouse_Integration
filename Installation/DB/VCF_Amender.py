import vcf
import mysql.connector
from gffutils.iterators import DataIterator

db_connection = mysql.connector.connect(host="localhost", database="GC_browser", user="root",
                                        password="")
db = db_connection.cursor()


def get_variant_list(marker_list):
    chroms = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
              "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "X", "Y"]
    for chrom in chroms:
        cmd = F"""
        SELECT DISTINCT ms.Marker_Accession 
            FROM GC_browser.marker_significances_chr{chrom} AS ms
            INNER JOIN all_markers AS am ON am.Accession = ms.Marker_Accession
            WHERE ms.SignificanceList0 != "" AND am.Status = "active";
        """
        results = db.execute(cmd, multi=True)
        for result in results:
            if result.with_rows:
                marker_list.extend([x for [(x)] in result.fetchall()])

    return marker_list


def get_gene_list(gene_list):
    cmd = F"""
        SELECT DISTINCT gc_mouse.mg.gene_symbol
            FROM gc_mouse.experiments AS ex
            INNER JOIN gc_mouse.mouse_markers AS mm ON mm.mouse_marker_id = ex.mouse_marker_id
            INNER JOIN gc_mouse.mouse_genes AS mg ON mg.id = mm.mouse_gene_id;
    """
    results = db.execute(cmd, multi=True)
    for result in results:
        if result.with_rows:
            gene_list = [x for [(x)] in result.fetchall()]

    return gene_list


def filter_ensemble_variants():
    vcf_in = vcf.Reader(filename='../api/JBrowseData/homo_sapiens_phenotype_associated.vcf')
    vcf_out = vcf.Writer(open('../api/JBrowseData/GC_only_variants.vcf', 'w'), vcf_in)
    marker_list = []
    marker_list = get_variant_list(marker_list)
    for rec in vcf_in:
        if rec.ID in marker_list:
            try:
                vcf_out.write_record(rec)
            except:
                print("pleb")


def filter_ensemble_genes():
    gff_in = "../api/JBrowseData/Homo_sapiens.GRCh37.87.chr_sorted.gff3"
    gff_out = "../api/JBrowseData/IMPC_Genes.gff3"
    gene_list = get_gene_list([])
    with open(gff_out, "w") as fout:
        for feature in DataIterator(gff_in):
            if feature.featuretype != "gene":
                continue
            gene_names = []
            try:
                gene_names = feature.attributes._d["Name"]
            except KeyError as ke:
                continue
            except:
                raise
            for gene in gene_list:
                for name in gene_names:
                    if gene.lower() == name.lower():
                        fout.write(str(feature) + "\n")


filter_ensemble_variants()
filter_ensemble_genes()
