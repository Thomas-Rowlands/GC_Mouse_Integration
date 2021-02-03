<?php
    class StringUtil {
        public static function convertToList($delimiter, $string) {
            $result = "";
            foreach (explode($delimiter, $string) as $item) {
                $result .= "<li>".$item."</li>";
            }
            return $result;
        }
    }
    
?>