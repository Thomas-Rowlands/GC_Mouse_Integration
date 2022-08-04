<?php
// ini_set('display_errors', '0');
    // error_reporting(E_ERROR | E_PARSE);
    require_once 'vendor/autoload.php';

    class GC_Connection {
        
        private $con;
        private $ini_array;
        public function __construct($dataset){
            $this->ini_array = parse_ini_file("../config/config.ini");
            $this->open($dataset);
        }

        private function open($dataset) {
            $this->con = new mysqli($this->ini_array["server"], $this->ini_array["username"], $this->ini_array["password"], $dataset, 3306);
            if ($this->con->connect_errno) {
                exit("Failed to connect to MySQL");
            } else {
                return true;
            }
        }

        private function close() {
            $this->con->close();
        }

        public function escape_input($input_string): string
        {
            return mysqli_escape_string($this->con, $input_string);
        }

        public function execute($query, $dataset){
            if ($this->open($dataset)) {
                $res = $this->con->query($query);
                $this->close();
                return $res;
            } else {
                exit("failed to open DB connection.");
            }
        }
    }

    class Neo_Connection {
        private $client;

        public function __construct(){
            $this->open();
        }

        private function open() {
            try {
                $this->client = GraphAware\Neo4j\Client\ClientBuilder::create()->addConnection('bolt', 'bolt://neo4j:12345@localhost:7687')->build();
            } catch (Exception $e) {
                echo $e->getMessage();
            }
        }

        public function execute($query, $params) {
            return $this->client->run($query, $params)->getRecords();
        }

    }

