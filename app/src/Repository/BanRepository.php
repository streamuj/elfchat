<?php
/* (c) Anton Medvedev <anton@elfet.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace ElfChat\Repository;

use Doctrine\ORM\EntityRepository;

class BanRepository extends EntityRepository
{
    public function findAll()
    {
        $dql = "SELECT b FROM ElfChat\Entity\Ban b ORDER BY b.created DESC";

        $query = $this->_em->createQuery($dql);

        return $query->getResult();
    }

    public function findActive($userId, $ip)
    {
        $dql = "
        SELECT b FROM ElfChat\Entity\Ban b
        WHERE (b.user = :userId OR b.ip = :ip) AND :now < b.created + b.howLong
        ";

        $query = $this->_em->createQuery($dql);
        $query->setParameter('userId', $userId);
        $query->setParameter('ip', $ip);
        $query->setParameter('now', time());
        $query->setMaxResults(1);

        return $query->getResult();
    }
}