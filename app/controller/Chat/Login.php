<?php
/* (c) Anton Medvedev <anton@elfet.ru>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace ElfChat\Controller\Chat;

use Doctrine\ORM\NoResultException;
use ElfChat\Controller;
use ElfChat\Entity\User\GuestUser;
use ElfChat\Entity\User;
use ElfChat\Security\Authentication\Remember;
use ElfChat\Validator\Constraints\UserName;
use Silicone\Route;
use Symfony\Component\HttpFoundation\Cookie;

class Login extends Controller
{
    /**
     * @Route("/login", name="login")
     */
    public function check()
    {
        $session = $this->app->session();
        $em = $this->app->entityManager();

        $form = $this->app->form()
            ->add('username')
            ->add('password', 'password')
            ->add('remember_me', 'checkbox', array('required' => false))
            ->getForm();

        $form->handleRequest($this->request);

        if ($form->isValid()) {
            $data = $form->getData();

            try {
                $user = User::findOneByName($data['username']);
            } catch (NoResultException $e) {
                $user = null;
            }

            if (null !== $user) {
                if (password_verify($data['password'], $user->password)) {
                    $session->set('user', $saved = array($user->id, $user->role));

                    $response = $this->app->redirect($this->app->url('chat'));

                    if ($data['remember_me']) {
                        $remember = $this->app['security.remember']->encode($saved);

                        $response->headers->setCookie(
                            new Cookie(Remember::REMEMBER_ME, $remember, time() + (3600 * 24 * 7))
                        );
                    }

                    return $response;
                }
            }

            $error = $this->app->trans('Bad credentials');
        }

        $guestForm = $this->app->form()
            ->add('guestname', 'text', array(
                'constraints' => new UserName(),
            ))
            ->getForm();

        $guestForm->handleRequest($this->request);

        if ($guestForm->isValid()) {
            $data = $guestForm->getData();

            $guest = new GuestUser();
            $guest->name = $data['guestname'];

            $em->persist($guest);
            $em->flush($guest);

            $session->set('user', array($guest->id, $guest->role));

            return $this->app->redirect($this->app->url('chat'));
        }

        $response = $this->render('login/login.twig', array(
            'error' => isset($error) ? $error : null,
            'form' => $form->createView(),
            'guestForm' => $guestForm->createView(),
        ));
        return $response;
    }

    /**
     * @Route("/logout", name="logout")
     */
    public function logout()
    {
        $this->app->session()->remove('user');
        $response = $this->app->redirect($this->app->url('chat'));
        $response->headers->clearCookie(Remember::REMEMBER_ME);
        return $response;
    }
} 