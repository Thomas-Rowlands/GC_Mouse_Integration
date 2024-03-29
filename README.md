# GWAS Central Homology

Model organism data integration with IMPC mouse gene knockouts.

## Requirements
### React Website
This web application utilises React, so having node package manager installed on the server will ensure project dependencies can be installed successfully. For a full list of dependencies, please view the package.json file.

Due to the various peer dependencies specifying versions, you will likely get an error when simply using "npm install", so please use "npm install --legacy-peer-deps" to successfully install all dependencies (they do work together!).

### PHP Server Side
Included within the "gcmouseapi" folder is a composer file, requiring composer to run. Due to legacy dependencies which are no longer updated, the command "composer install --ignore-platform-reqs" to ingore errors relating to PHP version (tested on PHP 7.3)

## Data Setup
### GC_Mouse Database
The provided SQL master script will create the required table structure, along with key constraints and stored procedures. Population of said tables can then commence by running the import python files located in "DB/Import" and "DB/mouse_import" respectfully. 

### Genomic Data
All reference genome and track data files should be located within "api/JBrowseData" directory and subdirectories on the Dev & Live LAMPs.


