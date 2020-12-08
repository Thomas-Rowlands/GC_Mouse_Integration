
<?php
if (isset($_GET["entry"])) {
    $doc = simplexml_load_file("mp.xml");
    $terms = array();
    $terms = $doc->xpath("//field/text()");

    $matches = [];

    for ($i = 0; $i < count($terms); $i++) {
        if (count($matches) > 8)
            break;
        if (stristr((string)$terms[$i], $_GET["entry"])) {
            array_push($matches, (string)$terms[$i]);
        }
    }
    echo json_encode($matches);
}




?> 