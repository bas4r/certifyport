#include <eosio/eosio.hpp>
#include <string>
#include <vector>
using namespace std;
using namespace eosio;

CONTRACT certify : public eosio::contract
{
public:
	struct signer
	{
		name name;
		bool issigned;
	};

private:
	TABLE certificate
	{
		uint64_t id;
		string certificatename;
		vector<name> participants;
		vector<signer> signers;

		uint64_t primary_key() const { return id; }
	};
	typedef eosio::multi_index<"certificate"_n, certificate> certificate_table;

	TABLE institution
	{
		uint64_t id;
		string name;

		uint64_t primary_key() const { return id; }
	};
	typedef eosio::multi_index<"institution"_n, institution> institution_table;

	template <typename T>
	void cleanTable()
	{
		T db(_self, _self.value);
		while (db.begin() != db.end())
		{
			auto itr = --db.end();
			db.erase(itr);
		}
	}
	template <typename T>
	void cleanTableScope(uint64_t scope)
	{
		T db(_self, scope);
		while (db.begin() != db.end())
		{
			auto itr = --db.end();
			db.erase(itr);
		}
	}

public:
	using contract::contract;
	certify(name self, name code, datastream<const char *> ds) : contract(self, code, ds) {}

	ACTION cleaninst()
	{
		require_auth(_self);
		cleanTable<institution_table>();
	}

	ACTION cleancert(uint64_t scope)
	{
		require_auth(_self);
		cleanTableScope<certificate_table>(scope);
	}

	ACTION createinst(uint64_t id, string name)
	{
		require_auth(_self);
		institution_table _institution(_self, _self.value);

		auto itr = _institution.find(id);
		check(itr == _institution.end(), "Company had been added before.");

		_institution.emplace(_self, [&](auto &c) {
			c.id = id;
			c.name = name;
		});
	}

	ACTION createcert(uint64_t id, uint64_t institutionid, string certificatename, vector<name> participants)
	{
		require_auth(_self);
		certificate_table _certificate(_self, institutionid);
		institution_table _institution(_self, _self.value);

		auto inst_itr = _institution.find(institutionid);
		check(inst_itr != _institution.end(), "institution couldn't found.");

		auto itr = _certificate.find(id);
		check(itr == _certificate.end(), "Certificate had been added before.");

		_certificate.emplace(_self, [&](auto &c) {
			c.id = id;
			c.certificatename = certificatename;
			c.participants = participants;
		});
	}

	ACTION deletecert(uint64_t id, uint64_t institutionid)
	{
		require_auth(_self);
		certificate_table _certificate(_self, institutionid);
		institution_table _institution(_self, _self.value);

		auto inst_itr = _institution.find(institutionid);
		check(inst_itr != _institution.end(), "institution couldn't found.");

		auto itr = _certificate.find(id);
		check(itr != _certificate.end(), "No certificate found.");

		_certificate.erase(itr);
	}

	ACTION addsigner(uint64_t id, uint64_t institutionid, vector<signer> signers)
	{
		require_auth(_self);
		certificate_table _certificate(_self, institutionid);

		auto itr = _certificate.find(id);
		check(itr != _certificate.end(), "Certificate does not exist.");
		vector<signer> newsign = itr->signers;
		newsign.insert(newsign.end(), signers.begin(), signers.end());

		_certificate.modify(itr, _self, [&](auto &c) {
			c.signers = newsign;
		});
	}

	ACTION signcert(uint64_t id, uint64_t institutionid, name signerr)
	{
		require_auth(signerr);
		certificate_table _certificate(_self, institutionid);

		auto itr = _certificate.find(id);
		check(itr != _certificate.end(), "Certificate does not exist.");
		vector<signer> signersArr = itr->signers;
		for (int i = 0; i < signersArr.size(); i++)
		{
			if (signersArr[i].name == signerr)
			{
				signersArr[i].issigned = 1;
				_certificate.modify(itr, _self, [&](auto &c) {
					c.signers = signersArr;
				});
				break;
			}
		}
	}
};
EOSIO_DISPATCH(certify, (createinst)(createcert)(deletecert)(addsigner)(signcert)(cleancert)(cleaninst))