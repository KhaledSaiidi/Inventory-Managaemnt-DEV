package org.example.repository;

import org.example.model.Status;
import org.example.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface UserRepository extends JpaRepository<User, String> {


   List<User> findAllByStatus(Status status);
   List<User> findAllByNickNameIn(Set<String> nickNames);


}
