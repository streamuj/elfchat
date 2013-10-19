<?php
/* (c) Anton Medvedev <anton@elfet.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Chat\Repository;

use Chat\Entity\User;
use Doctrine\ORM\EntityRepository;

class UserRepository extends EntityRepository
{
    public function findAll()
    {
        $dql = "
        SELECT u, a
        FROM Chat\Entity\User u
        LEFT JOIN u.avatar a
        ";

        $query = $this->_em->createQuery($dql);

        return $query->getResult();
    }
}