import sys
import Data
import DB


# 1) Download IMPC Data
# 2) For each phenotyped gene (currently 5861): get gene symbol and phenotype descriptions (MP terms)
# 3) Get Human gene ortholog
# 4) Map MP terms to HPO (then MeSH via PhenoMap)
# 5) Get SNPs associated with Human gene; either directly or convert gene symbol into a chromosomal range. Remember, GWAS Central uses genome build 37.
# 6) Analyse the overlap comparing mouse genes with GWAS SNPs - are the phenotypes equivalent?

def main(args=None):
    impc = Data.get_impc_data()
    human_pheno = Data.get_human_phenotype_data()
    Data.input_impc_data(impc)
    DB.insert_human_markers(human_pheno["Human Marker Symbol"])
    DB.insert_homolog_links(human_pheno["Human Marker Symbol"], human_pheno["Mouse Marker Symbol"])

if __name__ == "__main__":
    main()
