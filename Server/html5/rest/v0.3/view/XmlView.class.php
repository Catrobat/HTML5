<?php

class XmlView extends BaseView
{

  public function __construct($request)
  {
    parent::__construct($request);
  }

  public function writeResponseString($outputObject)
  {
    var_dump($outputObject);
  }

}
