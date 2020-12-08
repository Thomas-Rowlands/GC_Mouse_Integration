<?php
    // error_reporting(E_ERROR | E_PARSE);
    define("ini_data", parse_ini_file("config/config.ini")); //relative to controller.php

    class GC_Connection {
        
        private $con = null;

        public function __construct($dataset){
            $this->open($dataset);
        }

        private function open($dataset) {
            $this->con = new mysqli(constant("ini_data")["server"], constant("ini_data")["username"], constant("ini_data")["password"], $dataset);
            if ($this->con->connect_errno) {
                exit("Failed to connect to MySQL");
            } else {
                return true;
            }

        }

        private function close() {
            $this->con->close();
        }

        public function escape_input($input_string) {
            return mysqli_escape_string($this->con, $input_string);
        }

        public function execute($query, $dataset) {
            if ($this->open($dataset)) {
                $res = $this->con->query($query);
                $this->close();
                return $res;
            } else {
                exit("failed to open DB connection.");
            }
        }

    }
